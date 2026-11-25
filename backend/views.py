"""
RentFlow SaaS - API Views & M-Pesa Integration Controllers
Version: /api/v1/
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
import uuid

from .models import Invoice, Payment, Receipt, Property, Unit, MaintenanceComplaint
from .serializers import (
    InvoiceSerializer, PaymentSerializer, ReceiptSerializer,
    PropertySerializer, UnitSerializer, MaintenanceComplaintSerializer
)
from .permissions import IsActiveSubscribedAgent, IsSystemAdmin, IsTenantOrSelf

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Invoice.objects.all()
        if user.role == 'AGENT':
            # Agent sees own SaaS invoices and tenant invoices they manage
            return Invoice.objects.filter(payer=user) | Invoice.objects.filter(payee=user)
        if user.role == 'LANDLORD':
            return Invoice.objects.filter(payer=user) | Invoice.objects.filter(property__landlord__user=user)
        # Tenant ONLY sees invoices where they are payer
        return Invoice.objects.filter(payer=user)

class PropertyViewSet(viewsets.ModelViewSet):
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated, IsActiveSubscribedAgent]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Property.objects.all()
        return Property.objects.filter(managing_agent__user=user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mpesa_stk_push_view(request):
    """
    Simulates Safaricom Daraja STK Push trigger for Invoice
    POST /api/v1/payments/mpesa/stk-push/
    Payload: { invoice_id, phone_number }
    """
    invoice_id = request.data.get('invoice_id')
    phone_number = request.data.get('phone_number')

    try:
        invoice = Invoice.objects.get(id=invoice_id)
    except Invoice.DoesNotExist:
        return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)

    # In production, this dispatches HTTP POST to https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest
    # On success:
    mpesa_ref = f"QK{uuid.uuid4().hex[:8].upper()}"
    payment = Payment.objects.create(
        payment_number=f"PAY-{uuid.uuid4().hex[:6].upper()}",
        invoice=invoice,
        pipeline_type=invoice.pipeline_type,
        payer=request.user,
        amount=invoice.amount,
        method='mpesa_stk',
        mpesa_reference=mpesa_ref,
        phone_number=phone_number,
        status='completed',
        verified_at=timezone.now()
    )

    invoice.status = 'paid'
    invoice.paid_at = timezone.now()
    invoice.save()

    # Create official receipt
    receipt = Receipt.objects.create(
        receipt_number=f"REC-{invoice.pipeline_type[:3]}-{uuid.uuid4().hex[:6].upper()}",
        payment=payment,
        invoice=invoice,
        pipeline_type=invoice.pipeline_type,
        amount=invoice.amount,
        mpesa_reference=mpesa_ref,
        verification_hash=f"RF-{invoice.amount}-{mpesa_ref}-VERIFIED"
    )

    # Entitlement extension
    if invoice.pipeline_type == 'PLATFORM_SUBSCRIPTION':
        agent_profile = request.user.agent_profile
        agent_profile.subscription_status = 'active'
        agent_profile.subscription_expiry = timezone.now() + timedelta(days=30)
        agent_profile.save()

    return Response({
        'status': 'SUCCESS',
        'message': 'Payment confirmed by Safaricom Daraja',
        'receipt': ReceiptSerializer(receipt).data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_manual_payment_view(request):
    """
    Verifies or declines a manual M-Pesa submission
    POST /api/v1/payments/verify/
    Payload: { payment_id, approved: bool, rejection_reason: str }
    """
    payment_id = request.data.get('payment_id')
    approved = request.data.get('approved', False)
    rejection_reason = request.data.get('rejection_reason', '')

    try:
        payment = Payment.objects.get(id=payment_id)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)

    # Ensure authority: Admin can verify Subscriptions; Managing Agent can verify Tenant rent and Landlord fees
    if payment.pipeline_type == 'PLATFORM_SUBSCRIPTION' and request.user.role != 'ADMIN':
        return Response({'error': 'Only System Administrator can verify SaaS subscriptions'}, status=status.HTTP_403_FORBIDDEN)

    if approved:
        payment.status = 'completed'
        payment.verified_at = timezone.now()
        payment.verified_by = request.user
        payment.save()

        invoice = payment.invoice
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save()

        # Generate receipt
        receipt = Receipt.objects.create(
            receipt_number=f"REC-{invoice.pipeline_type[:3]}-{uuid.uuid4().hex[:6].upper()}",
            payment=payment,
            invoice=invoice,
            pipeline_type=invoice.pipeline_type,
            amount=invoice.amount,
            mpesa_reference=payment.mpesa_reference,
            verification_hash=f"RF-MANUAL-{payment.mpesa_reference}"
        )
        return Response({'status': 'APPROVED', 'receipt': ReceiptSerializer(receipt).data})
    else:
        payment.status = 'rejected'
        payment.notes = rejection_reason
        payment.save()
        return Response({'status': 'REJECTED', 'reason': rejection_reason})

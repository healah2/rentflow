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

from .models import (
    AgentProfile, FrontendSubmission, Invoice, LandlordProfile, Payment, Receipt,
    Property, Unit, User, MaintenanceComplaint
)
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
        if user.is_superuser or user.role == 'ADMIN':
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
    permission_classes = [IsAuthenticated, IsSystemAdmin | IsActiveSubscribedAgent]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'ADMIN':
            return Property.objects.all()
        return Property.objects.filter(managing_agent__user=user)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def frontend_submission_view(request):
    submission_type = request.data.get('submission_type')
    payload = request.data.get('payload')
    if not isinstance(submission_type, str) or not submission_type.strip():
        return Response({'submission_type': 'This field is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if not isinstance(payload, dict):
        return Response({'payload': 'Expected an object.'}, status=status.HTTP_400_BAD_REQUEST)

    if submission_type == 'create_agent' and not (request.user.is_superuser or request.user.role == 'ADMIN'):
        return Response({'detail': 'Only a system administrator can create agents.'}, status=status.HTTP_403_FORBIDDEN)
    if submission_type == 'update_agent_subscription' and not (request.user.is_superuser or request.user.role == 'ADMIN'):
        return Response({'detail': 'Only a system administrator can update agent subscriptions.'}, status=status.HTTP_403_FORBIDDEN)
    if submission_type in {'create_landlord', 'create_tenant_and_assign_room'} and request.user.role != 'AGENT':
        return Response({'detail': 'Only a managing agent can create landlord or tenant accounts.'}, status=status.HTTP_403_FORBIDDEN)

    account_data = payload
    if submission_type == 'create_apartment_with_rooms':
        nested_accounts = [
            room.get('newTenant')
            for room in payload.get('roomConfigs', [])
            if isinstance(room, dict) and isinstance(room.get('newTenant'), dict)
        ]
        account_payloads = nested_accounts
    elif submission_type in {'create_agent', 'create_landlord', 'create_tenant_and_assign_room'}:
        account_payloads = [account_data]
    else:
        account_payloads = []

    created_users = []
    for account in account_payloads:
        email = str(account.get('email', '')).strip().lower()
        phone = str(account.get('phoneNumber', '')).strip()
        full_name = str(account.get('fullName', '')).strip()
        if not email or not phone or not full_name:
            return Response({'detail': 'Name, email, and phone number are required to create an account.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(phone_number=phone).exists():
            return Response({'detail': f'An account already exists for {email} or phone number {phone}.'}, status=status.HTTP_400_BAD_REQUEST)

        role = {
            'create_agent': 'AGENT',
            'create_landlord': 'LANDLORD',
        }.get(submission_type, 'TENANT')
        user = User.objects.create_user(
            username=email,
            email=email,
            password=phone,
            first_name=full_name,
            phone_number=phone,
            role=role,
        )
        created_users.append(user)

        if role == 'AGENT':
            from datetime import timedelta
            from django.utils import timezone

            AgentProfile.objects.create(
                user=user,
                agency_name=str(payload.get('agencyName') or f'{full_name} Real Estate'),
                paybill_number=str(payload.get('paybillNumber') or '247247'),
                subscription_plan=str(payload.get('subscriptionPlan') or 'Professional'),
                subscription_status=str(payload.get('initialStatus') or 'pending_payment'),
                subscription_expiry=timezone.now() + timedelta(days=30),
                monthly_subscription_fee=payload.get('monthlySubscriptionFee') or 15000,
            )
        elif role == 'LANDLORD' and hasattr(request.user, 'agent_profile'):
            from datetime import timedelta
            from django.utils import timezone

            LandlordProfile.objects.create(
                user=user,
                managing_agent=request.user.agent_profile,
                monthly_management_fee=payload.get('monthlyFeeAmount') or 3500,
                fee_expiry=timezone.now() + timedelta(days=30),
                bank_name=str(payload.get('bankName') or ''),
                bank_account=str(payload.get('bankAccount') or ''),
                mpesa_disbursal_phone=phone,
            )

    submission = FrontendSubmission.objects.create(
        submitted_by=request.user,
        submission_type=submission_type.strip(),
        payload=payload,
    )
    return Response({
        'id': str(submission.pk),
        'submission_type': submission.submission_type,
        'created_at': submission.created_at,
        'created_accounts': [str(user.pk) for user in created_users],
    }, status=status.HTTP_201_CREATED)

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
    if payment.pipeline_type == 'PLATFORM_SUBSCRIPTION' and not (request.user.is_superuser or request.user.role == 'ADMIN'):
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

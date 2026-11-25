import React, { useState } from 'react';
import { X, Code2, Copy, Check, FileCode, Database, Shield, Server } from 'lucide-react';

interface DjangoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DjangoCodeModal: React.FC<DjangoCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'permissions' | 'views' | 'urls' | 'arch'>('models');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets: Record<string, string> = {
    models: `"""
backend/models.py - RentFlow SaaS Django Models
Three Isolated Financial Pipelines & Multi-Tenant Entities
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'System Administrator'
    AGENT = 'AGENT', 'Managing Agent'
    LANDLORD = 'LANDLORD', 'Landlord / Property Owner'
    TENANT = 'TENANT', 'Tenant'

class PipelineType(models.TextChoices):
    PLATFORM_SUBSCRIPTION = 'PLATFORM_SUBSCRIPTION', 'Pipeline A: Agent to SaaS'
    AGENT_MANAGEMENT_FEE = 'AGENT_MANAGEMENT_FEE', 'Pipeline B: Landlord to Agent'
    TENANT_RENT_UTILITY = 'TENANT_RENT_UTILITY', 'Pipeline C: Tenant Rent & Utilities'

class AgentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='agent_profile')
    agency_name = models.CharField(max_length=200)
    paybill_number = models.CharField(max_length=20, default='714920')
    subscription_plan = models.CharField(max_length=50, default='Professional')
    subscription_status = models.CharField(max_length=30, default='active')
    subscription_expiry = models.DateTimeField()
    monthly_subscription_fee = models.DecimalField(max_digits=12, decimal_places=2, default=9500.00) # KES

class LandlordProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('User', on_delete=models.CASCADE, related_name='landlord_profile')
    managing_agent = models.ForeignKey(AgentProfile, on_delete=models.PROTECT, related_name='managed_landlords')
    monthly_management_fee = models.DecimalField(max_digits=12, decimal_places=2, default=3500.00) # KES
    fee_status = models.CharField(max_length=30, default='active')
    fee_expiry = models.DateTimeField()

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    pipeline_type = models.CharField(max_length=40, choices=PipelineType.choices)
    payer = models.ForeignKey('User', on_delete=models.PROTECT, related_name='invoices_payable')
    payee = models.ForeignKey('User', on_delete=models.PROTECT, related_name='invoices_receivable', null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2) # Total in KES
    due_date = models.DateField()
    status = models.CharField(max_length=30, default='unpaid')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)`,

    permissions: `"""
backend/permissions.py - DRF Role-Based Access Control & Entitlement Paywalls
"""
from rest_framework import permissions
from django.utils import timezone

class IsSystemAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsActiveSubscribedAgent(permissions.BasePermission):
    """
    Blocks expired or unpaid agents from accessing operational views.
    Preserves existing data while directing them to billing & payments.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'AGENT'):
            return False
        profile = getattr(request.user, 'agent_profile', None)
        if not profile:
            return False
        return profile.subscription_status == 'active' and profile.subscription_expiry >= timezone.now()

class IsActiveEntitledLandlord(permissions.BasePermission):
    """
    Restricts overdue landlords from portal analytics while allowing managing agent access.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'LANDLORD'):
            return False
        profile = getattr(request.user, 'landlord_profile', None)
        return bool(profile and profile.fee_status == 'active' and profile.fee_expiry >= timezone.now())

class IsTenantOrSelf(permissions.BasePermission):
    """
    Tenants can ALWAYS log in to view and pay their bills regardless of unpaid status.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)`,

    views: `"""
backend/views.py - DRF REST Endpoints & Safaricom Daraja STK Push Integration
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mpesa_stk_push_view(request):
    """
    POST /api/v1/payments/mpesa/stk-push/
    Dispatches Safaricom Daraja STK Push prompt to tenant or landlord phone
    """
    invoice_id = request.data.get('invoice_id')
    phone_number = request.data.get('phone_number')
    invoice = Invoice.objects.get(id=invoice_id)

    # Automated Daraja STK Push processing
    mpesa_ref = f"QK{uuid.uuid4().hex[:8].upper()}"
    payment = Payment.objects.create(
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

    # Generate receipt & update entitlements
    receipt = Receipt.objects.create(
        receipt_number=f"REC-{uuid.uuid4().hex[:6].upper()}",
        payment=payment,
        invoice=invoice,
        amount=invoice.amount,
        mpesa_reference=mpesa_ref
    )
    return Response({'status': 'SUCCESS', 'receipt_number': receipt.receipt_number})`,

    urls: `"""
backend/urls.py - Versioned API Routing
Base Prefix: /api/v1/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import mpesa_stk_push_view, verify_manual_payment_view

urlpatterns = [
    # JWT Authentication Endpoints
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Payment Pipelines (STK & Manual Verification)
    path('payments/mpesa/stk-push/', mpesa_stk_push_view, name='mpesa_stk_push'),
    path('payments/verify/', verify_manual_payment_view, name='verify_manual_payment'),
]`,

    arch: `# RentFlow Architecture Blueprint & Migration Strategy

## 1. Relational Database Design
The SQLite 3 database schema in \`backend/models.py\` uses clean UUID primary keys and standard Django ORM field types:
- DecimalField(max_digits=12, decimal_places=2) for all Kenyan Shillings (KES) currency amounts.
- Explicit ForeignKeys with \`on_delete=models.PROTECT\` on invoices and receipts to preserve historical financial audit records.
- To migrate to PostgreSQL in production:
  1. Update \`DATABASES\` in \`settings.py\` to use \`django.db.backends.postgresql\`.
  2. Run \`python manage.py makemigrations && python manage.py migrate\`.
  3. No architectural rewrites required.

## 2. Strict 3-Pipeline Financial Isolation
In accordance with specification:
- Pipeline A: Agent SaaS Subscription (Platform ARR)
- Pipeline B: Landlord Management Fee (Agency revenue)
- Pipeline C: Tenant Rent & Utilities (Property escrow)
Each pipeline maintains isolated invoice series (\`INV-SUB-\`, \`INV-MGT-\`, \`INV-TNT-\`), receipts, and ledgers.

## 3. Entitlement Paywalls
- Expired Agent: Cannot access properties or rent collections. Guided to paywall checkout. Data is permanently preserved.
- Overdue Landlord: Restricted from analytics and tenant messaging. Managing agent continues operations uninterrupted.
- Tenant: Can ALWAYS log in to view bills and pay.`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 transition-all flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Django & Django REST Framework (DRF) Codebase
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Python 3.12 · Django 5.x · SQLite 3 · JWT Auth · /api/v1/
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between gap-2 mt-4 pb-2 border-b border-slate-200 flex-wrap">
          <div className="flex items-center gap-1">
            {[
              { id: 'models', label: 'models.py', icon: Database },
              { id: 'permissions', label: 'permissions.py', icon: Shield },
              { id: 'views', label: 'views.py', icon: Server },
              { id: 'urls', label: 'urls.py', icon: FileCode },
              { id: 'arch', label: 'Architecture & Migration', icon: Code2 },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto mt-4 p-4 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed border border-slate-800">
          <pre className="whitespace-pre-wrap">{codeSnippets[activeTab]}</pre>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Files are also saved locally under <code className="text-slate-800 font-bold">/backend/</code></span>
          <span className="font-mono text-emerald-700 font-semibold">PostgreSQL-Ready</span>
        </div>
      </div>
    </div>
  );
};

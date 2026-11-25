"""
RentFlow SaaS - Multi-Tenant Property Management Database Models
Framework: Django 5.x / Django REST Framework
Database: SQLite 3 (Production ready for PostgreSQL migration without architectural rewrite)
"""

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
import uuid

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', _('System Administrator')
    AGENT = 'AGENT', _('Managing Agent')
    LANDLORD = 'LANDLORD', _('Landlord / Property Owner')
    TENANT = 'TENANT', _('Tenant')

class PipelineType(models.TextChoices):
    PLATFORM_SUBSCRIPTION = 'PLATFORM_SUBSCRIPTION', _('Pipeline A: Agent to Platform SaaS')
    AGENT_MANAGEMENT_FEE = 'AGENT_MANAGEMENT_FEE', _('Pipeline B: Landlord to Agent Fee')
    TENANT_RENT_UTILITY = 'TENANT_RENT_UTILITY', _('Pipeline C: Tenant Rent & Utilities')

class SubscriptionStatus(models.TextChoices):
    ACTIVE = 'active', _('Active')
    PENDING_PAYMENT = 'pending_payment', _('Pending Payment')
    EXPIRED = 'expired', _('Expired')
    SUSPENDED = 'suspended', _('Suspended')

class InvoiceStatus(models.TextChoices):
    DRAFT = 'draft', _('Draft')
    UNPAID = 'unpaid', _('Unpaid')
    PENDING_VERIFICATION = 'pending_verification', _('Pending Verification')
    PAID = 'paid', _('Paid in Full')
    OVERDUE = 'overdue', _('Overdue')

class PaymentMethod(models.TextChoices):
    MPESA_STK = 'mpesa_stk', _('M-Pesa STK Push')
    MPESA_MANUAL = 'mpesa_manual', _('Manual M-Pesa Reference')
    BANK_TRANSFER = 'bank_transfer', _('Bank Transfer')

class PaymentStatus(models.TextChoices):
    PENDING_VERIFICATION = 'pending_verification', _('Pending Verification')
    COMPLETED = 'completed', _('Completed & Verified')
    REJECTED = 'rejected', _('Rejected')

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.TENANT)
    phone_number = models.CharField(max_length=20, unique=True, db_index=True)
    national_id = models.CharField(max_length=30, blank=True, null=True)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    REQUIRED_FIELDS = ['email', 'phone_number']

    class Meta:
        db_table = 'rentflow_users'

class AgentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    agency_name = models.CharField(max_length=200)
    paybill_number = models.CharField(max_length=20, default='714920')
    account_prefix = models.CharField(max_length=20, default='APX')
    subscription_plan = models.CharField(max_length=50, default='Professional')
    subscription_status = models.CharField(max_length=30, choices=SubscriptionStatus.choices, default=SubscriptionStatus.PENDING_PAYMENT)
    subscription_expiry = models.DateTimeField()
    monthly_subscription_fee = models.DecimalField(max_digits=12, decimal_places=2, default=9500.00) # in KES
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rentflow_agent_profiles'

class LandlordProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='landlord_profile')
    managing_agent = models.ForeignKey(AgentProfile, on_delete=models.PROTECT, related_name='managed_landlords')
    monthly_management_fee = models.DecimalField(max_digits=12, decimal_places=2, default=3500.00) # in KES
    fee_status = models.CharField(max_length=30, choices=SubscriptionStatus.choices, default=SubscriptionStatus.ACTIVE)
    fee_expiry = models.DateTimeField()
    bank_name = models.CharField(max_length=100)
    bank_account = models.CharField(max_length=50)
    mpesa_disbursal_phone = models.CharField(max_length=20)

    class Meta:
        db_table = 'rentflow_landlord_profiles'

class Property(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    managing_agent = models.ForeignKey(AgentProfile, on_delete=models.PROTECT, related_name='properties')
    landlord = models.ForeignKey(LandlordProfile, on_delete=models.PROTECT, related_name='properties')
    title = models.CharField(max_length=200)
    street = models.CharField(max_length=200)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100, default='Nairobi')
    total_units = models.IntegerField(default=1)
    occupied_units = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rentflow_properties'

class Unit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='units')
    unit_number = models.CharField(max_length=50)
    unit_type = models.CharField(max_length=50, default='2-Bedroom')
    base_rent = models.DecimalField(max_digits=12, decimal_places=2) # in KES
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2) # in KES
    water_fixed_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    trash_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default='vacant')
    current_tenant = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rented_units')

    class Meta:
        db_table = 'rentflow_units'

class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    pipeline_type = models.CharField(max_length=40, choices=PipelineType.choices)
    payer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='invoices_payable')
    payee = models.ForeignKey(User, on_delete=models.PROTECT, related_name='invoices_receivable', null=True, blank=True)
    property = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2) # Total KES
    due_date = models.DateField()
    billing_period = models.CharField(max_length=50)
    status = models.CharField(max_length=30, choices=InvoiceStatus.choices, default=InvoiceStatus.UNPAID)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'rentflow_invoices'

class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    charge_type = models.CharField(max_length=50) # rent, deposit, electricity, water, trash, parking
    title = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'rentflow_invoice_items'

class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment_number = models.CharField(max_length=50, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='payments')
    pipeline_type = models.CharField(max_length=40, choices=PipelineType.choices)
    payer = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments_made')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=30, choices=PaymentMethod.choices)
    mpesa_reference = models.CharField(max_length=50, db_index=True)
    phone_number = models.CharField(max_length=20)
    status = models.CharField(max_length=30, choices=PaymentStatus.choices, default=PaymentStatus.PENDING_VERIFICATION)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_payments')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rentflow_payments'

class Receipt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    payment = models.OneToOneField(Payment, on_delete=models.PROTECT, related_name='receipt')
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name='receipts')
    pipeline_type = models.CharField(max_length=40, choices=PipelineType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    mpesa_reference = models.CharField(max_length=50)
    verification_hash = models.CharField(max_length=100)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rentflow_receipts'

class MaintenanceComplaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='complaints')
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_complaints')
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50)
    urgency = models.CharField(max_length=30, default='medium')
    status = models.CharField(max_length=30, default='submitted')
    description = models.TextField()
    resolution_notes = models.TextField(blank=True, null=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rentflow_complaints'

class FrontendSubmission(models.Model):
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='frontend_submissions')
    submission_type = models.CharField(max_length=80, db_index=True)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rentflow_frontend_submissions'
        ordering = ['-created_at']

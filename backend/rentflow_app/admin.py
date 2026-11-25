"""
RentFlow SaaS - Django Admin Site Registration
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User,
    AgentProfile,
    LandlordProfile,
    Property,
    Unit,
    Invoice,
    InvoiceItem,
    Payment,
    Receipt,
    MaintenanceComplaint,
    FrontendSubmission
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'full_name', 'phone_number', 'role', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('username', 'email', 'phone_number', 'first_name', 'last_name')
    
    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('agency_name', 'user', 'subscription_plan', 'subscription_status', 'monthly_subscription_fee', 'subscription_expiry')
    list_filter = ('subscription_status', 'subscription_plan')
    search_fields = ('agency_name', 'user__email', 'paybill_number')

@admin.register(LandlordProfile)
class LandlordProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'managing_agent', 'monthly_management_fee', 'fee_status', 'fee_expiry', 'mpesa_disbursal_phone')
    list_filter = ('fee_status',)
    search_fields = ('user__email', 'mpesa_disbursal_phone', 'bank_account')

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'neighborhood', 'city', 'total_units', 'managing_agent', 'landlord')
    list_filter = ('city', 'neighborhood')
    search_fields = ('title', 'neighborhood', 'street')

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('unit_number', 'property', 'unit_type', 'base_rent', 'status', 'current_tenant')
    list_filter = ('status', 'unit_type')
    search_fields = ('unit_number', 'property__title')

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'pipeline_type', 'amount', 'payer', 'payee', 'status', 'due_date')
    list_filter = ('pipeline_type', 'status')
    search_fields = ('invoice_number', 'payer__email', 'payee__email')
    inlines = [InvoiceItemInline]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_number', 'pipeline_type', 'method', 'amount', 'mpesa_reference', 'status', 'created_at')
    list_filter = ('pipeline_type', 'method', 'status')
    search_fields = ('payment_number', 'mpesa_reference', 'phone_number')

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'pipeline_type', 'amount', 'mpesa_reference', 'issued_at')
    list_filter = ('pipeline_type',)
    search_fields = ('receipt_number', 'mpesa_reference', 'verification_hash')

@admin.register(MaintenanceComplaint)
class MaintenanceComplaintAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'title', 'category', 'urgency', 'status', 'unit')
    list_filter = ('category', 'urgency', 'status')
    search_fields = ('ticket_number', 'title')

@admin.register(FrontendSubmission)
class FrontendSubmissionAdmin(admin.ModelAdmin):
    list_display = ('submission_type', 'submitted_by', 'created_at')
    list_filter = ('submission_type', 'created_at')
    search_fields = ('submission_type', 'submitted_by__username', 'submitted_by__email')
    readonly_fields = ('submitted_by', 'submission_type', 'payload', 'created_at')

"""
RentFlow SaaS - Django REST Framework Serializers
"""
from rest_framework import serializers
from .models import (
    User, AgentProfile, LandlordProfile, Property, Unit,
    Invoice, InvoiceItem, Payment, Receipt, MaintenanceComplaint
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'avatar_url']

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'charge_type', 'title', 'amount']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    payer_name = serializers.ReadOnlyField(source='payer.get_full_name')

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'pipeline_type', 'payer', 'payer_name',
            'amount', 'due_date', 'billing_period', 'status', 'items', 'created_at', 'paid_at'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'invoice', 'pipeline_type', 'amount',
            'method', 'mpesa_reference', 'phone_number', 'status', 'created_at'
        ]

class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = [
            'id', 'receipt_number', 'payment', 'invoice', 'pipeline_type',
            'amount', 'mpesa_reference', 'verification_hash', 'issued_at'
        ]

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'title', 'street', 'neighborhood', 'city', 'total_units', 'occupied_units']

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'property', 'unit_number', 'unit_type', 'base_rent', 'security_deposit', 'status']

class MaintenanceComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceComplaint
        fields = [
            'id', 'ticket_number', 'unit', 'tenant', 'title', 'category',
            'urgency', 'status', 'description', 'resolution_notes', 'estimated_cost', 'created_at'
        ]

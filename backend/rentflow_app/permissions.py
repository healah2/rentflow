"""
RentFlow SaaS - Role-Based Access Control & Entitlement Permission Classes
"""
from rest_framework import permissions
from django.utils import timezone

class IsSystemAdmin(permissions.BasePermission):
    """Platform owner access only."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.role == 'ADMIN')
        )

class IsActiveSubscribedAgent(permissions.BasePermission):
    """
    Requires user to be an Agent WITH an active, unexpired SaaS subscription.
    Expired agents are restricted to billing and payment endpoints.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'AGENT'):
            return False
        
        agent_profile = getattr(request.user, 'agent_profile', None)
        if not agent_profile:
            return False

        # Check subscription status and expiry
        if agent_profile.subscription_status != 'active':
            return False
        if agent_profile.subscription_expiry < timezone.now():
            return False

        return True

class IsActiveEntitledLandlord(permissions.BasePermission):
    """
    Requires user to be a Landlord whose monthly management fee is paid up.
    Restricts overdue landlords from operational views while preserving agent access.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'LANDLORD'):
            return False

        landlord_profile = getattr(request.user, 'landlord_profile', None)
        if not landlord_profile:
            return False

        return landlord_profile.fee_status == 'active' and landlord_profile.fee_expiry >= timezone.now()

class IsTenantOrSelf(permissions.BasePermission):
    """
    Tenants can ALWAYS log in and inspect their own bills regardless of payment status.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN':
            return True
        if request.user.role == 'AGENT':
            return True # Agent manages this tenant
        return hasattr(obj, 'payer_id') and obj.payer_id == request.user.id

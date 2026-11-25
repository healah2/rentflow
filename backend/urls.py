"""
RentFlow SaaS - API URL Routing
Base prefix: /api/v1/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    InvoiceViewSet, PropertyViewSet,
    mpesa_stk_push_view, verify_manual_payment_view
)

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'properties', PropertyViewSet, basename='property')

urlpatterns = [
    # JWT Authentication Endpoints
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # M-Pesa STK & Verification Endpoints
    path('payments/mpesa/stk-push/', mpesa_stk_push_view, name='mpesa_stk_push'),
    path('payments/verify/', verify_manual_payment_view, name='verify_manual_payment'),

    # Resource Routers
    path('', include(router.urls)),
]

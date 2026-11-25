"""
RentFlow SaaS Backend - Root URL Router
Version: /api/v1/
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rentflow_app.auth_views import RentFlowTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT Authentication Endpoints
    path('api/v1/auth/token/', RentFlowTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Versioned API Endpoints
    path('api/v1/', include('rentflow_app.urls')),
]

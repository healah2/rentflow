from rest_framework_simplejwt.views import TokenObtainPairView

from .authentication import RentFlowTokenObtainPairSerializer


class RentFlowTokenObtainPairView(TokenObtainPairView):
    serializer_class = RentFlowTokenObtainPairSerializer

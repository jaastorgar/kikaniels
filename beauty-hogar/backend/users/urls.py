from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, 
    RegisterClientView, 
    RegisterAdminView,
    UserProfileView,
    CheckAdminExistsView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/client/', RegisterClientView.as_view(), name='register_client'),
    path('register/admin/', RegisterAdminView.as_view(), name='register_admin'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('check-admin/', CheckAdminExistsView.as_view(), name='check_admin'),
]
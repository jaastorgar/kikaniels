from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, 
    RegisterClientView, 
    RegisterAdminView,
    UserProfileView,
    ChangePasswordView,
    CheckAdminExistsView,
    WorkerListCreateView,
    WorkerDetailView,
    WorkerPayAllPendingView,
    PublicSpecialistsListView,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/client/', RegisterClientView.as_view(), name='register_client'),
    path('register/admin/', RegisterAdminView.as_view(), name='register_admin'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('check-admin/', CheckAdminExistsView.as_view(), name='check_admin'),
    path('workers/', WorkerListCreateView.as_view(), name='worker_list_create'),
    path('workers/<int:pk>/', WorkerDetailView.as_view(), name='worker_detail'),
    path('workers/<int:pk>/pay-all/', WorkerPayAllPendingView.as_view(), name='worker_pay_all'),
    path('specialists/', PublicSpecialistsListView.as_view(), name='public_specialists'),
]

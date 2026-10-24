from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import (
    UserSerializer,
    WorkerManagementSerializer,
    ChangePasswordSerializer,
    UserRegistrationSerializer,
    AdminRegistrationSerializer,
)

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == 'admin' or request.user.is_admin)
        )

class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.get(email__iexact=request.data.get('email', ''))
        response.data['user'] = UserSerializer(user).data
        return response

class RegisterClientView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Usuario registrado exitosamente',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class RegisterAdminView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'admin_register'
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': 'Administrador registrado exitosamente',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)

        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {'current_password': ['La contraseña actual es incorrecta.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Contraseña actualizada exitosamente.'})

class CheckAdminExistsView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        admin_exists = User.objects.filter(role='admin', is_active=True).exists()
        return Response({'admin_exists': admin_exists})

class WorkerListCreateView(generics.ListCreateAPIView):
    """Permite al Administrador listar y contratar especialistas (peluqueros, barberos, manicuristas, etc.)."""
    serializer_class = WorkerManagementSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role='worker').order_by('-is_active', 'first_name')

class WorkerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Permite al Administrador editar comisión, especialidad, estado o eliminar un especialista."""
    serializer_class = WorkerManagementSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.filter(role='worker')

class WorkerPayAllPendingView(APIView):
    """Liquida todos los pagos pendientes de citas completadas de un especialista."""
    permission_classes = [IsAdminRole]

    def post(self, request, pk):
        from appointments.models import Appointment, Notification
        from appointments.utils import send_appointment_notification

        try:
            worker = User.objects.get(pk=pk, role='worker')
        except User.DoesNotExist:
            return Response({'error': 'Especialista no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        pending_qs = Appointment.objects.filter(
            worker=worker,
            status='completed',
            payout_status='pending'
        )
        count = pending_qs.count()
        if count == 0:
            return Response({'error': 'Este especialista no tiene pagos pendientes por liquidar.'}, status=status.HTTP_400_BAD_REQUEST)

        total_paid = sum(float(a.worker_earnings) for a in pending_qs)
        now = timezone.now()
        last_apt = pending_qs.first()
        pending_qs.update(payout_status='paid', paid_at=now)

        if last_apt:
            msg = f"Pago liquidado: Se registró el pago de ${int(total_paid):,} por {count} servicio(s) completado(s)."
            Notification.objects.create(user=worker, appointment=last_apt, message=msg)
            send_appointment_notification(worker.id, {
                "id": last_apt.id,
                "title": "Pago Recibido",
                "message": msg,
                "status": "completed",
                "is_new": True
            })

        return Response({
            'message': f'Se liquidaron {count} servicios por un total de ${int(total_paid):,}.',
            'paid_count': count,
            'total_paid': total_paid
        })

class PublicSpecialistsListView(APIView):
    """Lista pública de profesionales activos para que el cliente elija con quién agendar."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        professionals = User.objects.filter(
            role__in=['worker', 'admin'],
            is_active=True
        ).order_by('-role', 'first_name')
        data = [
            {
                'id': p.id,
                'first_name': p.first_name,
                'last_name': p.last_name,
                'full_name': p.full_name,
                'role': p.role,
                'specialty': p.specialty or ('general' if p.role == 'admin' else ''),
                'specialty_display': p.specialty_display if p.role == 'worker' else 'Dirección / Especialista Principal',
                'bio': p.bio,
            }
            for p in professionals
        ]
        return Response(data)

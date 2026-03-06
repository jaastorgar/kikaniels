from django.urls import path
from .views import (
    ServiceViewSet, 
    TimeSlotViewSet, 
    AppointmentViewSet,
    NotificationViewSet,
    BulkCreateTimeSlotsView,
    AdminDashboardStatsView,
    NotificationUnreadCountView
)

urlpatterns = [
    # --- SERVICIOS ---
    path('services/', ServiceViewSet.as_view({
        'get': 'list', 
        'post': 'create'
    }), name='service-list'),
    
    path('services/<int:pk>/', ServiceViewSet.as_view({
        'get': 'retrieve', 
        'put': 'update', 
        'patch': 'partial_update', 
        'delete': 'destroy'
    }), name='service-detail'),

    # --- HORARIOS (TIME SLOTS) ---
    path('time-slots/', TimeSlotViewSet.as_view({
        'get': 'list', 
        'post': 'create'
    }), name='time-slot-list'),
    
    # Ruta para obtener slots disponibles (usada por BookAppointment.jsx)
    path('time-slots/available/', TimeSlotViewSet.as_view({
        'get': 'list' # Se apoya en el filtro de get_queryset en views.py
    }), name='available-slots'),

    path('time-slots/<int:pk>/', TimeSlotViewSet.as_view({
        'get': 'retrieve', 
        'put': 'update', 
        'patch': 'partial_update', 
        'delete': 'destroy'
    }), name='time-slot-detail'),

    path('time-slots/bulk-create/', BulkCreateTimeSlotsView.as_view(), name='bulk-create-slots'),

    # --- CITAS (APPOINTMENTS) ---
    path('', AppointmentViewSet.as_view({
        'get': 'list', 
        'post': 'create'
    }), name='appointment-list'),

    path('<int:pk>/', AppointmentViewSet.as_view({
        'get': 'retrieve', 
        'put': 'update', 
        'patch': 'partial_update', 
        'delete': 'destroy'
    }), name='appointment-detail'),

    # Rutas para acciones administrativas (Confirmar, Cancelar, etc.)
    path('<int:pk>/confirm/', AppointmentViewSet.as_view({'post': 'confirm'}), name='appointment-confirm'),
    path('<int:pk>/cancel/', AppointmentViewSet.as_view({'post': 'cancel'}), name='appointment-cancel'),
    path('<int:pk>/complete/', AppointmentViewSet.as_view({'post': 'complete'}), name='appointment-complete'),
    path('<int:pk>/reschedule/', AppointmentViewSet.as_view({'post': 'reschedule'}), name='appointment-reschedule'),

    # --- NOTIFICACIONES ---
    path('notifications/', NotificationViewSet.as_view({
        'get': 'list'
    }), name='notification-list'),

    # SOLUCIÓN: Solo una ruta para unread_count (usamos la vista especializada)
    path('notifications/unread_count/', NotificationUnreadCountView.as_view(), name='unread-notification-count'),

    path('notifications/<int:pk>/read/', NotificationViewSet.as_view({
        'post': 'read'
    }), name='notification-read'),

    # --- DASHBOARD Y ESTADÍSTICAS ---
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
]
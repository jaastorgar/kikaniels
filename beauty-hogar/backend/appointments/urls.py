from django.urls import path
from .views import (
    ServiceViewSet, 
    TimeSlotViewSet, 
    AppointmentViewSet,
    NotificationViewSet,
    BulkCreateTimeSlotsView,
    AdminDashboardStatsView,
    WorkerDashboardStatsView,
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
    
    path('time-slots/available/', TimeSlotViewSet.as_view({
        'get': 'available'
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

    # Acciones sobre citas
    path('<int:pk>/confirm/', AppointmentViewSet.as_view({'post': 'confirm'}), name='appointment-confirm'),
    path('<int:pk>/cancel/', AppointmentViewSet.as_view({'post': 'cancel'}), name='appointment-cancel'),
    path('<int:pk>/complete/', AppointmentViewSet.as_view({'post': 'complete'}), name='appointment-complete'),
    path('<int:pk>/reschedule/', AppointmentViewSet.as_view({'post': 'reschedule'}), name='appointment-reschedule'),
    path('<int:pk>/assign-worker/', AppointmentViewSet.as_view({'post': 'assign_worker'}), name='appointment-assign-worker'),
    path('<int:pk>/mark-paid/', AppointmentViewSet.as_view({'post': 'mark_paid'}), name='appointment-mark-paid'),

    # --- NOTIFICACIONES ---
    path('notifications/', NotificationViewSet.as_view({
        'get': 'list'
    }), name='notification-list'),

    path('notifications/unread_count/', NotificationUnreadCountView.as_view(), name='unread-notification-count'),

    path('notifications/<int:pk>/', NotificationViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='notification-detail'),

    path('notifications/<int:pk>/read/', NotificationViewSet.as_view({
        'post': 'read'
    }), name='notification-read'),

    # --- DASHBOARD Y ESTADÍSTICAS ---
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('worker/stats/', WorkerDashboardStatsView.as_view(), name='worker-stats'),
]

from django.urls import path
from .views import (
    ServiceListCreateView, ServiceDetailView,
    AvailableTimeSlotsView, TimeSlotListCreateView, TimeSlotDetailView,
    AppointmentListCreateView, AppointmentDetailView,
    AdminAppointmentActionView, RescheduleAppointmentView,
    NotificationListView, MarkNotificationReadView,
    DashboardStatsView, ClientHistoryView, BulkCreateTimeSlotsView
)

urlpatterns = [
    # Servicios
    path('services/', ServiceListCreateView.as_view(), name='service-list'),
    path('services/<int:pk>/', ServiceDetailView.as_view(), name='service-detail'),
    
    # Horarios
    path('time-slots/available/', AvailableTimeSlotsView.as_view(), name='available-slots'),
    path('time-slots/', TimeSlotListCreateView.as_view(), name='time-slot-list'),
    path('time-slots/<int:pk>/', TimeSlotDetailView.as_view(), name='time-slot-detail'),
    path('time-slots/bulk-create/', BulkCreateTimeSlotsView.as_view(), name='bulk-create-slots'),
    
    # Citas
    path('', AppointmentListCreateView.as_view(), name='appointment-list'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('<int:pk>/<str:action>/', AdminAppointmentActionView.as_view(), name='appointment-action'),
    path('<int:pk>/reschedule/', RescheduleAppointmentView.as_view(), name='appointment-reschedule'),
    
    # Notificaciones
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark-read'),
    
    # Historial y Stats
    path('history/', ClientHistoryView.as_view(), name='client-history'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
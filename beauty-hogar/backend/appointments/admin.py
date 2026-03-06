from django.contrib import admin
from .models import Service, TimeSlot, Appointment, Notification

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    # Corregido: 'duration_minutes' -> 'duration'
    list_display = ['name', 'price', 'duration', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['date', 'start_time', 'end_time', 'status']
    list_filter = ['status', 'date']
    date_hierarchy = 'date'

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    # Corregido: 'time_slot' -> 'timeslot'
    list_display = ['id', 'client', 'service', 'timeslot', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['client__email', 'client__first_name', 'service__name']
    date_hierarchy = 'created_at'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    # Añadí 'message' para que sea más fácil leer las notificaciones desde el panel
    list_display = ['user', 'appointment', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
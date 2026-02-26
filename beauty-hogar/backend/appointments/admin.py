from django.contrib import admin
from .models import Service, TimeSlot, Appointment, Notification

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'duration_minutes', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']

@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['date', 'start_time', 'end_time', 'status']
    list_filter = ['status', 'date']
    date_hierarchy = 'date'

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'client', 'service', 'time_slot', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['client__email', 'client__first_name', 'service__name']
    date_hierarchy = 'created_at'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'appointment', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
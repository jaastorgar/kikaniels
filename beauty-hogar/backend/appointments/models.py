from django.db import models
from django.conf import settings

class Service(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=0)
    duration_minutes = models.IntegerField(help_text="Duración en minutos")
    image = models.ImageField(upload_to='services/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'services'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - ${self.price}"

class TimeSlot(models.Model):
    STATUS_CHOICES = (
        ('available', 'Disponible'),
        ('occupied', 'Ocupado'),
        ('blocked', 'Bloqueado'),
    )
    
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'time_slots'
        ordering = ['date', 'start_time']
        unique_together = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.date} {self.start_time.strftime('%H:%M')} - {self.get_status_display()}"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('rescheduled', 'Reagendada'),
        ('cancelled', 'Cancelada'),
        ('completed', 'Completada'),
    )
    
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='appointments')
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE, related_name='appointment')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    whatsapp_notified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'appointments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Cita {self.id} - {self.client.full_name} - {self.service.name} - {self.get_status_display()}"
    
    @property
    def total_price(self):
        return self.service.price
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        
        if not is_new:
            old = Appointment.objects.get(pk=self.pk)
            old_status = old.status
        
        super().save(*args, **kwargs)
        
        # Actualizar estado del time_slot
        if self.status in ['confirmed', 'rescheduled']:
            self.time_slot.status = 'occupied'
        elif self.status in ['cancelled', 'pending']:
            self.time_slot.status = 'available'
        self.time_slot.save()
        
        # Enviar notificación WebSocket si el estado cambió
        if not is_new and old_status != self.status:
            from .consumers import AppointmentConsumer
            import asyncio
            asyncio.create_task(
                AppointmentConsumer.notify_status_change(self.id, self.status, self.client.id)
            )

class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notificación para {self.user.full_name} - {self.appointment}"
from django.db import models, transaction
from django.conf import settings

class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.PositiveIntegerField(help_text="Duración en minutos")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_data='services/', null=True, blank=True)

    def __str__(self):
        return self.name

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

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.date} {self.start_time} - {self.end_time} ({self.status})"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
    )

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    timeslot = models.OneToOneField('TimeSlot', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Todo lo que sigue debe estar indentado un nivel dentro de save
        with transaction.atomic():
            is_new = self._state.adding
            
            if is_new:
                # Bloqueamos el TimeSlot en la BD para evitar que otro proceso lo use
                # Usamos select_for_update() para prevenir condiciones de carrera
                slot = TimeSlot.objects.select_for_update().get(id=self.timeslot.id)
                
                if slot.status != 'available':
                    raise ValueError("El horario ya no está disponible.")
                
                # Asignamos el precio actual del servicio a la cita
                self.total_price = self.service.price
                slot.status = 'occupied'
                slot.save()
            else:
                # Si la cita se cancela, liberamos el horario
                if self.status == 'cancelled':
                    # Usamos update para que sea una operación directa y rápida
                    TimeSlot.objects.filter(id=self.timeslot.id).update(status='available')

            # El guardado final del modelo Appointment
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client.email} - {self.service.name} - {self.timeslot.date}"

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
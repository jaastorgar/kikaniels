from django.db import models, transaction
from django.conf import settings

class Service(models.Model):
    """
    Representa un tratamiento de belleza. 
    Cada servicio pertenece obligatoriamente a un administrador (proveedor).
    """
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='services',
        limit_choices_to={'role': 'admin'}
    )
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration = models.PositiveIntegerField(help_text="Duración en minutos")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    image = models.ImageField(upload_to='services/', null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.provider.email}"

class TimeSlot(models.Model):
    """
    Representa un bloque de tiempo disponible en la agenda de un profesional.
    """
    STATUS_CHOICES = (
        ('available', 'Disponible'),
        ('occupied', 'Ocupado'),
        ('blocked', 'Bloqueado'),
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='timeslots',
        limit_choices_to={'role': 'admin'}
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    class Meta:
        ordering = ['date', 'start_time']
        # Un profesional no puede tener dos bloques que inicien a la misma hora el mismo día
        unique_together = ('provider', 'date', 'start_time')

    def __str__(self):
        return f"{self.date} {self.start_time} - {self.provider.email}"

class Appointment(models.Model):
    """
    Vincula a un cliente con un servicio y un horario específico.
    """
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
        """
        Garantiza que la agenda sea consecuente: el servicio y el horario 
        deben pertenecer al mismo profesional.
        """
        with transaction.atomic():
            is_new = self._state.adding
            
            if is_new:
                # Bloqueamos el registro del horario para evitar reservas simultáneas
                slot = TimeSlot.objects.select_for_update().get(id=self.timeslot.id)
                
                # VALIDACIÓN CRÍTICA DE CONSECUENCIA
                if self.service.provider != slot.provider:
                    raise ValueError("El servicio y el horario pertenecen a profesionales distintos.")
                
                if slot.status != 'available':
                    raise ValueError("Este horario ya no se encuentra disponible.")
                
                # Sincronizamos el precio actual del servicio
                self.total_price = self.service.price
                
                # Marcamos el horario como ocupado
                slot.status = 'occupied'
                slot.save()
            else:
                # Si la cita se cancela, liberamos el horario automáticamente
                if self.status == 'cancelled':
                    TimeSlot.objects.filter(id=self.timeslot.id).update(status='available')

            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client.email} reservó {self.service.name}"

class Notification(models.Model):
    """
    Almacena los mensajes para la campana de notificaciones.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings

class Service(models.Model):
    """
    Representa un tratamiento de belleza del catálogo de Beauty Hogar.
    """
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='services',
        limit_choices_to={'role__in': ['admin', 'worker']}
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
    Representa un bloque de tiempo disponible en la agenda de un profesional (admin o especialista).
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
        limit_choices_to={'role__in': ['admin', 'worker']}
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ('provider', 'date', 'start_time')

    def __str__(self):
        return f"{self.date} {self.start_time} - {self.provider.email}"

class Appointment(models.Model):
    """
    Vincula a un cliente con un servicio, un horario y un especialista,
    calculando automáticamente la comisión del especialista y la ganancia del negocio.
    """
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('rescheduled', 'Reagendada'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
    )

    PAYOUT_STATUS_CHOICES = (
        ('not_applicable', 'No Aplica'),
        ('pending', 'Pendiente de Pago'),
        ('paid', 'Pagado'),
    )

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    timeslot = models.ForeignKey('TimeSlot', on_delete=models.CASCADE, related_name='appointments')
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='worker_appointments',
        limit_choices_to={'role__in': ['admin', 'worker']}
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Desglose de comisiones y pagos a especialistas
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    worker_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    business_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payout_status = models.CharField(max_length=20, choices=PAYOUT_STATUS_CHOICES, default='not_applicable')
    paid_at = models.DateTimeField(null=True, blank=True)

    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _calculate_commissions(self):
        total = Decimal(str(self.total_price or self.service.price or 0))
        if self.worker and self.worker.role == 'worker':
            if not self.commission_rate or Decimal(str(self.commission_rate)) <= 0:
                self.commission_rate = Decimal(str(self.worker.commission_rate or 60))
            rate = Decimal(str(self.commission_rate)) / Decimal('100')
            self.worker_earnings = (total * rate).quantize(Decimal('0.01'))
            self.business_earnings = (total - self.worker_earnings).quantize(Decimal('0.01'))
            if self.status == 'cancelled':
                self.payout_status = 'not_applicable'
            elif self.payout_status == 'not_applicable':
                self.payout_status = 'pending'
        else:
            self.commission_rate = Decimal('0.00')
            self.worker_earnings = Decimal('0.00')
            self.business_earnings = total.quantize(Decimal('0.01'))
            self.payout_status = 'not_applicable'

    def save(self, *args, **kwargs):
        with transaction.atomic():
            is_new = self._state.adding
            
            if is_new:
                slot = TimeSlot.objects.select_for_update().get(id=self.timeslot.id)
                
                if slot.status != 'available':
                    raise ValueError("Este horario ya no se encuentra disponible.")
                
                self.total_price = self.service.price

                # Si no se especificó trabajador explícitamente, se asigna el dueño del bloque horario
                if not self.worker_id:
                    self.worker = slot.provider
                
                slot.status = 'occupied'
                slot.save()
            else:
                if self.status == 'cancelled':
                    TimeSlot.objects.filter(id=self.timeslot.id).update(status='available')

            self._calculate_commissions()
            super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client.email} reservó {self.service.name}"

class Notification(models.Model):
    """
    Almacena los mensajes para la campana de notificaciones.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

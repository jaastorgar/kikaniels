from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, Group
from django.db import models
from django.utils import timezone
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('client', 'Cliente'),
        ('worker', 'Especialista'),
        ('admin', 'Administrador'),
    )

    SPECIALTY_CHOICES = (
        ('peluquero', 'Peluquero / Estilista'),
        ('barbero', 'Barbero'),
        ('manicurista', 'Manicurista / Uñas'),
        ('maquilladora', 'Maquillador(a)'),
        ('cosmetologa', 'Cosmetóloga / Facial'),
        ('masajista', 'Masajista / Spa'),
        ('depilacion', 'Depilación'),
        ('general', 'Especialista Integral'),
    )
    
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    
    # Campos profesionales para especialistas (trabajadores)
    specialty = models.CharField(max_length=50, choices=SPECIALTY_CHOICES, blank=True, default='')
    commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=60.00,
        help_text="Porcentaje de comisión para el especialista por servicio completado (0-100)"
    )
    bio = models.TextField(blank=True, default='')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone']
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def specialty_display(self):
        return dict(self.SPECIALTY_CHOICES).get(self.specialty, self.specialty or 'Especialista')
    
    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = 'admin'
            self.is_admin = True
            self.is_staff = True
        else:
            self.is_admin = (self.role == 'admin')
            if self.role == 'admin':
                self.is_staff = True
        super().save(*args, **kwargs)
        try:
            role_group, _ = Group.objects.get_or_create(name=self.role)
            if not self.groups.filter(name=self.role).exists():
                self.groups.set([role_group])
        except Exception:
            pass

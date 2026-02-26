import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beauty_hogar.settings')
django.setup()

from users.models import User

def create_initial_admin():
    if not User.objects.filter(email='admin@beautyhogar.cl').exists():
        admin = User.objects.create_superuser(
            email='kika@beautyhogar.cl',
            password='BeautyAdmin2026!',
            first_name='Administrador',
            last_name='Beauty Hogar',
            phone='+56951415619',
            is_admin=True
        )
        print(f"Admin creado: {admin.email}")
        print("Contraseña: BeautyAdmin2024!")
    else:
        print("El admin ya existe")

if __name__ == '__main__':
    create_initial_admin()
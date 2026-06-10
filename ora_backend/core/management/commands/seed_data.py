#core/mangement/commands/seed_data.py
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import (
    User, Pole, Department, Association, 
    CNMember, Animateur, Mentor
)


class Command(BaseCommand):
    help = 'Crée les données de test pour ORA'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Création des données de test...")
        
        # 1. Départements
        dept_75, _ = Department.objects.get_or_create(
            code='75', defaults={'name': 'Paris'}
        )
        dept_69, _ = Department.objects.get_or_create(
            code='69', defaults={'name': 'Rhône'}
        )
        
        # 2. Pôles
        pole_idf, _ = Pole.objects.get_or_create(
            code='IDF', 
            defaults={
                'name': 'Île-de-France',
                'main_department': dept_75,
                'contact_email': 'idf@ora.fr'
            }
        )
        pole_lyon, _ = Pole.objects.get_or_create(
            code='LYON',
            defaults={
                'name': 'Lyon',
                'main_department': dept_69,
                'contact_email': 'lyon@ora.fr'
            }
        )
        
        # 3. Associations
        asso_caf_idf, _ = Association.objects.get_or_create(
            code='CAF-IDF',
            defaults={'name': 'CAF Paris', 'pole': pole_idf}
        )
        asso_caf_lyon, _ = Association.objects.get_or_create(
            code='CAF-LYON',
            defaults={'name': 'CAF Lyon', 'pole': pole_lyon}
        )
        
        # 4. Superuser CN
        user_cn, created = User.objects.get_or_create(
            email='cn@ora.fr',
            defaults={
                'first_name': 'Directeur',
                'last_name': 'National',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            user_cn.set_password('ora2026')
            user_cn.save()
            CNMember.objects.create(
                user=user_cn,
                first_name='Directeur',
                last_name='National',
                email='cn@ora.fr',
                is_super_admin=True
            )
            self.stdout.write(self.style.SUCCESS(f"CN créé: cn@ora.fr / ora2026"))
        
        # 5. ACP IDF
        user_acp, created = User.objects.get_or_create(
            email='acp.idf@ora.fr',
            defaults={'first_name': 'Marie', 'last_name': 'Coordinator'}
        )
        if created:
            user_acp.set_password('ora2026')
            user_acp.save()
            Animateur.objects.create(
                user=user_acp,
                pole=pole_idf,
                association=asso_caf_idf,
                first_name='Marie',
                last_name='Coordinator',
                email='acp.idf@ora.fr',
                is_acp=True,
                is_ap=False
            )
            self.stdout.write(self.style.SUCCESS(f"ACP IDF créé: acp.idf@ora.fr / ora2026"))
        
        # 6. AP IDF
        user_ap, created = User.objects.get_or_create(
            email='ap.idf@ora.fr',
            defaults={'first_name': 'Jean', 'last_name': 'Animateur'}
        )
        if created:
            user_ap.set_password('ora2026')
            user_ap.save()
            Animateur.objects.create(
                user=user_ap,
                pole=pole_idf,
                association=asso_caf_idf,
                first_name='Jean',
                last_name='Animateur',
                email='ap.idf@ora.fr',
                is_acp=False,
                is_ap=True
            )
            self.stdout.write(self.style.SUCCESS(f"AP IDF créé: ap.idf@ora.fr / ora2026"))
        
        # 7. Mentor IDF
        user_mentor, created = User.objects.get_or_create(
            email='mentor.idf@ora.fr',
            defaults={'first_name': 'Pierre', 'last_name': 'Mentor'}
        )
        if created:
            user_mentor.set_password('ora2026')
            user_mentor.save()
            Mentor.objects.create(
                user=user_mentor,
                pole=pole_idf,
                association=asso_caf_idf,
                first_name='Pierre',
                last_name='Mentor',
                email='mentor.idf@ora.fr',
                max_capacity=2,
                disponibilite_reelle=2,
                is_trained=True
            )
            self.stdout.write(self.style.SUCCESS(f"Mentor IDF créé: mentor.idf@ora.fr / ora2026"))
        
        self.stdout.write(self.style.SUCCESS("\nDonnées de test créées avec succès !"))
        self.stdout.write("Comptes de test:")
        self.stdout.write("  - CN: cn@ora.fr / ora2026")
        self.stdout.write("  - ACP: acp.idf@ora.fr / ora2026")
        self.stdout.write("  - AP: ap.idf@ora.fr / ora2026")
        self.stdout.write("  - Mentor: mentor.idf@ora.fr / ora2026")
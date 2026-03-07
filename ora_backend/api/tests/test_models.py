from django.test import TestCase
from django.utils import timezone
from datetime import date

from api.tests.factories import (
    MentorFactory, YoungRequestFactory, MentoratFactory
)


class TestMentorModel(TestCase):
    def test_disponibilite_ne_pas_depasser_max(self):
        mentor = MentorFactory(max_capacity=3, disponibilite_reelle=5)
        mentor.save()
        self.assertEqual(mentor.disponibilite_reelle, 3)  # Limité à max
    
    def test_disponibilite_ne_pas_etre_negative(self):
        mentor = MentorFactory(disponibilite_reelle=-2)
        mentor.save()
        self.assertEqual(mentor.disponibilite_reelle, 0)
    
    def test_full_name(self):
        mentor = MentorFactory(first_name='Jean', last_name='Dupont')
        self.assertEqual(mentor.full_name, 'Jean Dupont')


class TestMentoratModel(TestCase):
    def test_creation_mentorat(self):
        mentorat = MentoratFactory()
        self.assertEqual(mentorat.status, 'ACTIVE')
        self.assertIsNotNone(mentorat.created_at)
    
    def test_cloturer_mentorat(self):
        mentorat = MentoratFactory()
        mentor = mentorat.mentor
        disponibilite_avant = mentor.disponibilite_reelle
        
        mentorat.cloturer(reason='Terminé', statut='CLOSED')
        
        # Vérifie statut
        self.assertEqual(mentorat.status, 'CLOSED')
        self.assertIsNotNone(mentorat.closed_at)
        
        # Vérifie libération mentor
        mentor.refresh_from_db()
        self.assertEqual(mentor.disponibilite_reelle, disponibilite_avant + 1)
        
        # Vérifie demande
        self.assertEqual(mentorat.young_request.status, 'CLOSED')
    
    def test_get_duree_mois(self):
        mentorat = MentoratFactory()
        mentorat.assigned_at = date(2024, 1, 15)
        
        # Mock date du jour
        from unittest.mock import patch
        with patch('django.utils.timezone.now') as mock_now:
            mock_now.return_value = timezone.make_aware(timezone.datetime(2024, 4, 15))
            duree = mentorat.get_duree_mois()
            self.assertEqual(duree, 3)
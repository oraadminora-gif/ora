from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from core.models import Mentorat

from api.tests.factories import (
    UserFactory, CNMemberFactory, AnimateurFactory,
    MentorFactory, YoungRequestFactory, PoleFactory, AssociationFactory
)


class TestAuthViews(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory(email='test@ora.fr')
        self.user.set_password('test123')
        self.user.save()

    def test_login_success(self):
        url = reverse('login')
        data = {'email': 'test@ora.fr', 'password': 'test123'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_login_failure(self):
        url = reverse('login')
        data = {'email': 'test@ora.fr', 'password': 'wrong'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_authenticated(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('me')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@ora.fr')


class TestCNViews(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.cn = CNMemberFactory().user
        self.pole = PoleFactory()

    def test_cn_dashboard(self):
        self.client.force_authenticate(user=self.cn)
        url = reverse('cn-dashboard')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], 'CN')
        self.assertIn('stats_nationales', response.data)

    def test_cn_dashboard_forbidden_to_acp(self):
        acp = AnimateurFactory(is_acp=True, is_ap=False).user
        self.client.force_authenticate(user=acp)
        url = reverse('cn-dashboard')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestMentorViews(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.pole = PoleFactory()
        self.acp = AnimateurFactory(is_acp=True, is_ap=False, pole=self.pole).user
        self.mentor = MentorFactory(pole=self.pole)

    def test_list_mentors_as_acp(self):
        self.client.force_authenticate(user=self.acp)
        url = '/api/mentors/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)  # Pagination

    def test_filter_mentors_disponibles(self):
        self.client.force_authenticate(user=self.acp)
        url = '/api/mentors/?disponible=true'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestMatchingViews(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.pole = PoleFactory()
        self.association = AssociationFactory(pole=self.pole)

        # ACP (coordinateur)
        self.acp = AnimateurFactory(
            is_acp=True, is_ap=False,
            pole=self.pole,
            association=self.association
        ).user

        # AP (animateur simple) pour le suivi – indispensable !
        self.ap_animateur = AnimateurFactory(
            is_acp=False, is_ap=True,
            pole=self.pole,
            association=self.association
        )

        self.mentor = MentorFactory(
            pole=self.pole,
            association=self.association,
            disponibilite_reelle=1
        )

        self.demande = YoungRequestFactory(
            pole=self.pole,
            association=self.association,
            status='PENDING'
        )

    def test_matching_suggestions(self):
        self.client.force_authenticate(user=self.acp)
        url = f'/api/pole/matching/{self.demande.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('suggestions', response.data)
        self.assertIn('demande', response.data)

    def test_assign_mentor(self):
        self.client.force_authenticate(user=self.acp)
        url = '/api/pole/matching/assign/'
        data = {
            'mentor_id': self.mentor.id,
            'request_id': self.demande.id
        }
        response = self.client.post(url, data, format='json')

        if response.status_code != 201:
            print("Erreur 400 :", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('mentorat_id', response.data)

        # Vérifie que le mentorat est créé
        self.assertTrue(Mentorat.objects.filter(id=response.data['mentorat_id']).exists())

        # Vérifie mise à jour disponibilité
        self.mentor.refresh_from_db()
        self.assertEqual(self.mentor.disponibilite_reelle, 0)
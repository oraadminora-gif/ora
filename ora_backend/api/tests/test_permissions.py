from rest_framework.test import APIRequestFactory, APITestCase
from api.tests.factories import UserFactory, CNMemberFactory, AnimateurFactory, MentorFactory
from api.permissions import IsACP, IsAP, IsCN, IsMentor

class TestPermissions(APITestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.cn = CNMemberFactory().user
        self.ap = AnimateurFactory(is_coordinator=False).user
        self.mentor = MentorFactory().user
        self.acp = AnimateurFactory(is_coordinator=True).user
        self.user_simple = UserFactory()   # ← ajouté

    def test_is_cn(self):
        permission = IsCN()
        request = self.factory.get('/')
        request.user = self.cn   # ← correction (au lieu de self.cn_user)
        self.assertTrue(permission.has_permission(request, None))
        request.user = self.acp
        self.assertFalse(permission.has_permission(request, None))
        # etc.

    def test_is_ap(self):
        permission = IsAP()
        request = self.factory.get('/')
        request.user = self.ap
        self.assertTrue(permission.has_permission(request, None))
        request.user = self.acp
        self.assertFalse(permission.has_permission(request, None))
        # etc.

    def test_is_acp(self):
        permission = IsACP()
        request = self.factory.get('/')
        request.user = self.acp
        self.assertTrue(permission.has_permission(request, None))
        request.user = self.ap
        self.assertFalse(permission.has_permission(request, None))
        # etc.

    def test_is_mentor(self):
        permission = IsMentor()
        request = self.factory.get('/')
        request.user = self.mentor
        self.assertTrue(permission.has_permission(request, None))
        request.user = self.user_simple   # ← correction (au lieu de self.user_simple? déjà bon)
        self.assertFalse(permission.has_permission(request, None))
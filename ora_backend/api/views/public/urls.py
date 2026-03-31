from django.urls import path
from .young_request import CreateYoungRequestView
from .evaluation import PublicEvaluationView
from .poles import PublicPolesView
from .mentor_candidature import PublicMentorCandidatureView
from .contact import PublicContactView

urlpatterns = [
    path('demande/', CreateYoungRequestView.as_view(), name='create-demande'),
    path('evaluation/<str:token>/', PublicEvaluationView.as_view(), name='public-evaluation'),
    path('poles/', PublicPolesView.as_view(), name='public-poles'),
    path('mentor-candidatures/', PublicMentorCandidatureView.as_view(), name='public-mentor-candidatures'),
    path('contact/', PublicContactView.as_view(), name='public-contact'),
]

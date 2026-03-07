from django.urls import path
from .young_request import CreateYoungRequestView
from .evaluation import PublicEvaluationView
from .poles import PublicPolesView

urlpatterns = [
    path('demande/', CreateYoungRequestView.as_view(), name='create-demande'),
    path('evaluation/<str:token>/', PublicEvaluationView.as_view(), name='public-evaluation'),
    path('poles/', PublicPolesView.as_view(), name='public-poles'),
]

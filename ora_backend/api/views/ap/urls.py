# api/views/ap/urls.py
from django.urls import path
from .dashboard import (
    APDashboardView,
    APMentorDetailView,
    APMentoratAlerteView,
    APMentoratNotesView,
    APConfirmerClotureView,
    APUpdateJeuneView,
    APEtablissementsView,
)

urlpatterns = [
    # Dashboard principal de l'AP (liste ses mentors + stats)
    path('dashboard/', APDashboardView.as_view(), name='ap-dashboard'),

    # Détail d'un mentor spécifique
    path('mentors/<int:mentor_id>/', APMentorDetailView.as_view(), name='ap-mentor-detail'),

    # Alertes sur un mentorat (signaler / résoudre)
    path('mentorats/<int:mentorat_id>/alerte/', APMentoratAlerteView.as_view(), name='ap-mentorat-alerte'),

    # Notes de suivi AP sur un mentorat
    path('mentorats/<int:mentorat_id>/notes/', APMentoratNotesView.as_view(), name='ap-mentorat-notes'),

    # Confirmation ou rejet d'une demande de clôture soumise par le mentor
    path('mentorats/<int:mentorat_id>/confirmer-cloture/', APConfirmerClotureView.as_view(), name='ap-confirmer-cloture'),

    # Modifier situation / établissement du jeune
    path('mentorats/<int:mentorat_id>/jeune/', APUpdateJeuneView.as_view(), name='ap-update-jeune'),

    # Liste des établissements du pôle (pour dropdown)
    path('etablissements/', APEtablissementsView.as_view(), name='ap-etablissements'),
]

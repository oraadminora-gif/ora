# api/views/ap/urls.py
from django.urls import path
from .dashboard import (
    APDashboardView,
    APMesMentorats,
    APMentorDetailView,
    APMentoratAlerteView,
    APMentoratNotesView,
    APConfirmerClotureView,
    APCloturerDirectView,
    APSuiviListCreateView,
    APSuiviDetailView,
    APMentoratSuiviView,
    APMentoratFinancementsView,
    APMentoratFinancementDeleteView,
    APUpdateJeuneView,
    APEtablissementsView,
)

urlpatterns = [
    # Dashboard principal de l'AP (liste ses mentors + stats)
    path('dashboard/', APDashboardView.as_view(), name='ap-dashboard'),

    # Liste paginée des mentorats dont l'AP est responsable
    path('mes-mentorats/', APMesMentorats.as_view(), name='ap-mes-mentorats'),

    # Détail d'un mentor spécifique
    path('mentors/<int:mentor_id>/', APMentorDetailView.as_view(), name='ap-mentor-detail'),

    # Alertes sur un mentorat (signaler / résoudre)
    path('mentorats/<int:mentorat_id>/alerte/', APMentoratAlerteView.as_view(), name='ap-mentorat-alerte'),

    # Notes de suivi AP sur un mentorat
    path('mentorats/<int:mentorat_id>/notes/', APMentoratNotesView.as_view(), name='ap-mentorat-notes'),

    # Confirmation ou rejet d'une demande de clôture soumise par le mentor
    path('mentorats/<int:mentorat_id>/confirmer-cloture/', APConfirmerClotureView.as_view(), name='ap-confirmer-cloture'),

    # Clôture directe par l'AP (sans passer par le mentor)
    path('mentorats/<int:mentorat_id>/cloturer-direct/', APCloturerDirectView.as_view(), name='ap-cloturer-direct'),

    # Gestion des suivis (rencontres) par l'AP/ACP
    path('mentorats/<int:mentorat_id>/suivis/', APSuiviListCreateView.as_view(), name='ap-suivi-list-create'),
    path('mentorats/<int:mentorat_id>/suivis/<int:suivi_id>/', APSuiviDetailView.as_view(), name='ap-suivi-detail'),

    # Suivi avancé : problématiques, dates, alerte, infos jeune
    path('mentorats/<int:mentorat_id>/suivi/', APMentoratSuiviView.as_view(), name='ap-mentorat-suivi'),

    # Financements d'un mentorat
    path('mentorats/<int:mentorat_id>/financements/', APMentoratFinancementsView.as_view(), name='ap-mentorat-financements'),
    path('mentorats/<int:mentorat_id>/financements/<int:mf_id>/', APMentoratFinancementDeleteView.as_view(), name='ap-mentorat-financement-delete'),

    # Modifier situation / établissement du jeune
    path('mentorats/<int:mentorat_id>/jeune/', APUpdateJeuneView.as_view(), name='ap-update-jeune'),

    # Liste des établissements du pôle (pour dropdown)
    path('etablissements/', APEtablissementsView.as_view(), name='ap-etablissements'),
]

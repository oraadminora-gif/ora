from django.urls import path
from .matching       import MatchingSuggestionsView, AssignMentorView
from .mentors        import PoleMentorsView, PoleMentorDetailView
from .animateurs     import PoleAnimateursView, PoleAnimateurDetailView
from .mentorats      import PoleMentoratListView, PoleMentoratDetailView
from .export_csv     import ExportMentoratsCsvView
from .requests       import PendingRequestsView, RerouterDemandeView, SetEtablissementDemandeView, CreateDemandeView
from .associations   import PoleAssociationsView
from .departments    import DepartmentsView
from .etablissements import PoleEtablissementsView
from .annuaire       import PoleAnnuaireView
from .candidatures_mentors import PoleCandidaturesMentorsView, PoleCandidatureMentorActionView

urlpatterns = [
    # ── Référentiels ─────────────────────────────────────────
    path('associations/',   PoleAssociationsView.as_view(),  name='pole-associations'),
    path('departments/',    DepartmentsView.as_view(),       name='pole-departments'),
    path('etablissements/', PoleEtablissementsView.as_view(), name='pole-etablissements'),
    path('annuaire/',       PoleAnnuaireView.as_view(),      name='pole-annuaire'),

    # ── Mentors ──────────────────────────────────────────────
    path('mentors/',                 PoleMentorsView.as_view(),      name='pole-mentors'),
    path('mentors/<int:mentor_id>/', PoleMentorDetailView.as_view(), name='pole-mentor-detail'),

    # ── Animateurs (APs) ─────────────────────────────────────
    path('animateurs/',                    PoleAnimateursView.as_view(),      name='pole-animateurs'),
    path('animateurs/<int:animateur_id>/', PoleAnimateurDetailView.as_view(), name='pole-animateur-detail'),

    # ── Mentorats ─────────────────────────────────────────────
    path('mentorats/',                   PoleMentoratListView.as_view(),   name='pole-mentorats'),
    path('mentorats/export-csv/',        ExportMentoratsCsvView.as_view(), name='pole-mentorats-export-csv'),
    path('mentorats/<int:mentorat_id>/', PoleMentoratDetailView.as_view(), name='pole-mentorat-detail'),

    # ── Demandes / Matching ───────────────────────────────────
    path('requests/',                                  CreateDemandeView.as_view(),           name='create-demande'),
    path('requests/pending/',                          PendingRequestsView.as_view(),         name='pending-requests'),
    path('requests/<int:pk>/rerouter/',                RerouterDemandeView.as_view(),         name='rerouter-demande'),
    path('requests/<int:pk>/etablissement/',           SetEtablissementDemandeView.as_view(), name='set-etablissement-demande'),
    path('matching/<int:request_id>/',                 MatchingSuggestionsView.as_view(),     name='matching-suggestions'),
    path('matching/assign/',                           AssignMentorView.as_view(),            name='assign-mentor'),

    # ── Candidatures Mentors ──────────────────────────────────
    path('candidatures-mentors/',                              PoleCandidaturesMentorsView.as_view(),              name='pole-candidatures-mentors'),
    path('candidatures-mentors/<int:pk>/<str:action>/',        PoleCandidatureMentorActionView.as_view(),          name='pole-candidature-mentor-action'),
]

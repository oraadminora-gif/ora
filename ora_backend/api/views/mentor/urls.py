# api/views/mentor/urls.py
from django.urls import path
from .dashboard import (
    MentorDashboardView,
    MentorUpdateProfileView,
    MentorUpdateCapaciteView,
    MentorSuiviListCreateView,
    MentorSuiviDetailView,
    MentorCloturerMentoratView,
    MentorUpdateJeuneView,
    MentorEtablissementsView,
    DepartmentListView,
)

urlpatterns = [
    path('dashboard/',                                          MentorDashboardView.as_view(),         name='mentor-dashboard'),
    path('update-profile/',                                     MentorUpdateProfileView.as_view(),     name='mentor-update-profile'),
    path('update-capacite/',                                    MentorUpdateCapaciteView.as_view(),    name='mentor-update-capacite'),
    path('mentorats/<int:mentorat_id>/suivis/',                 MentorSuiviListCreateView.as_view(),   name='mentor-suivis'),
    path('mentorats/<int:mentorat_id>/suivis/<int:suivi_id>/',  MentorSuiviDetailView.as_view(),       name='mentor-suivi-detail'),
    path('mentorats/<int:mentorat_id>/cloturer/',               MentorCloturerMentoratView.as_view(),  name='mentor-cloturer'),
    path('mentorats/<int:mentorat_id>/jeune/',                 MentorUpdateJeuneView.as_view(),       name='mentor-update-jeune'),
    path('etablissements/',                                     MentorEtablissementsView.as_view(),    name='mentor-etablissements'),
    path('departments/',                                        DepartmentListView.as_view(),          name='mentor-departments'),
]

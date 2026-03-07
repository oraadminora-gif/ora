# api/urls.py  ← VERSION MISE À JOUR
# Changement : ajout de path('ap/', include('api.views.ap.urls'))
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views.viewsets import (
    PoleViewSet, MentorViewSet, YoungRequestViewSet,
    MentoratViewSet, AnimateurViewSet
)
from api.views.kpis import PoleKPIsView, NationalKPIsView
from api.views.financements import FinancementsListView

router = DefaultRouter()
router.register(r'poles', PoleViewSet, basename='pole')
router.register(r'mentors', MentorViewSet, basename='mentor')
router.register(r'demandes', YoungRequestViewSet, basename='demande')
router.register(r'mentorats', MentoratViewSet, basename='mentorat')
router.register(r'animateurs', AnimateurViewSet, basename='animateur')

urlpatterns = [
    # Auth
    path('auth/', include('api.auth.urls')),

    # ViewSets
    path('', include(router.urls)),

    # KPIs
    path('kpis/pole/', PoleKPIsView.as_view(), name='pole-kpis'),
    path('kpis/national/', NationalKPIsView.as_view(), name='national-kpis'),

    # Référentiels globaux
    path('financements/', FinancementsListView.as_view(), name='financements'),

    # Vues personnalisées par rôle
    path('cn/',          include('api.views.cn.urls')),
    path('pole/',        include('api.views.pole.urls')),
    path('association/', include('api.views.association.urls')),
    path('mentor/',      include('api.views.mentor.urls')),
    path('ap/',          include('api.views.ap.urls')),
    path('acp/',         include('api.views.acp.urls')),
    path('public/',      include('api.views.public.urls')),
]

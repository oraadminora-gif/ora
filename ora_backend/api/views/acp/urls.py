# api/views/acp/urls.py
from django.urls import path
from .dashboard import ACPDashboardView

urlpatterns = [
    # Dashboard principal de l'ACP (vue pôle complet)
    path('dashboard/', ACPDashboardView.as_view(), name='acp-dashboard'),
]

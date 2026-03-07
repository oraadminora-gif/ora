from django.urls import path
from .dashboard import APDashboardView

urlpatterns = [
    path('dashboard/', APDashboardView.as_view(), name='ap-dashboard'),
]
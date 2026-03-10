from django.urls import path
from .dashboard     import CNDashboardView
from .animateurs    import CNAnimateursView, CNAnimateurDetailView
from .annuaire      import CNAnnuaireView
from .membres       import CNMembresView, CNMembreDetailView, CNMembreMeView
from .implantations import CNImplantationsView
from .retribution   import RetributionView

urlpatterns = [
    path('dashboard/',           CNDashboardView.as_view(),       name='cn-dashboard'),
    path('implantations/',       CNImplantationsView.as_view(),   name='cn-implantations'),
    path('animateurs/',          CNAnimateursView.as_view(),      name='cn-animateurs'),
    path('animateurs/<int:pk>/', CNAnimateurDetailView.as_view(), name='cn-animateur-detail'),
    path('annuaire/',            CNAnnuaireView.as_view(),        name='cn-annuaire'),
    path('retribution/',         RetributionView.as_view(),       name='cn-retribution'),
    # ordre important : 'me' avant '<int:pk>'
    path('membres/',             CNMembresView.as_view(),         name='cn-membres'),
    path('membres/me/',          CNMembreMeView.as_view(),        name='cn-membre-me'),
    path('membres/<int:pk>/',    CNMembreDetailView.as_view(),    name='cn-membre-detail'),
]

# api/pagination.py
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Pagination par défaut de l'API.

    La pagination DRF standard ignore silencieusement ?page_size= tant que
    `page_size_query_param` n'est pas défini : le frontend appelait déjà
    ?page_size=100 sur plusieurs listes (pôles, mentors, demandes,
    mentorats, animateurs) en pensant récupérer tout, alors que la page
    restait plafonnée à PAGE_SIZE=20 — d'où des listes/menus déroulants
    tronqués (ex. 20 pôles affichés sur 28 réels). Cette classe honore
    enfin ce paramètre, borné par max_page_size pour éviter les abus.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 200

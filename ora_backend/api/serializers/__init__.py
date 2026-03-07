from .user import UserSerializer, UserCreateSerializer
from .pole import PoleSerializer, DepartmentSerializer, AssociationSerializer, AssociationListSerializer
from .animateur import AnimateurSerializer, AnimateurCreateSerializer
from .mentor import MentorSerializer, MentorCreateSerializer, MentorListSerializer
from .young_request import YoungRequestSerializer, YoungRequestCreateSerializer, YoungRequestListSerializer
from .mentorat import MentoratSerializer, MentoratCreateSerializer, MentoratListSerializer
from .cn_member import CNMemberSerializer
from .etablissement import EtablissementSerializer, EtablissementCreateSerializer
from .financement import FinancementSerializer, MentoratFinancementSerializer

__all__ = [
    # User
    'UserSerializer',
    'UserCreateSerializer',
    # Pole/Reference
    'PoleSerializer',
    'DepartmentSerializer',
    'AssociationSerializer',
    'AssociationListSerializer',
    # Animateur
    'AnimateurSerializer',
    'AnimateurCreateSerializer',
    # Mentor
    'MentorSerializer',
    'MentorCreateSerializer',
    'MentorListSerializer',
    # YoungRequest
    'YoungRequestSerializer',
    'YoungRequestCreateSerializer',
    'YoungRequestListSerializer',
    # Mentorat
    'MentoratSerializer',
    'MentoratCreateSerializer',
    'MentoratListSerializer',
    # CN
    'CNMemberSerializer',
    # Etablissement
    'EtablissementSerializer',
    'EtablissementCreateSerializer',
    # Financement
    'FinancementSerializer',
    'MentoratFinancementSerializer',
]

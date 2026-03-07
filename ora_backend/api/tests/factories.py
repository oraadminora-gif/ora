import factory
from django.contrib.auth import get_user_model

from core.models import (
    Pole, Department, Association, Animateur, 
    Mentor, YoungRequest, Mentorat, CNMember
)

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@test.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True


class DepartmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Department
    
    code = factory.Sequence(lambda n: f'{n:02d}')
    name = factory.Faker('city')


class PoleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Pole
        skip_postgeneration_save = True   # ← ajouté

    code = factory.Sequence(lambda n: f'P{n:03d}')
    name = factory.Faker('city')
    status = 'ACTIVE'

    @factory.post_generation
    def associations(self, create, extracted, **kwargs):
        if not create:
            return

        if extracted:
            for association in extracted:
                association.pole = self
                association.save()
        else:
            AssociationFactory(pole=self)



class AssociationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Association
    
    code = factory.Sequence(lambda n: f'ASSO{n:03d}')
    name = factory.Faker('company')
    is_active = True
    pole = factory.SubFactory(PoleFactory)


class CNMemberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CNMember
    
    user = factory.SubFactory(UserFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.LazyAttribute(lambda obj: obj.user.email)
    is_active = True


class AnimateurFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Animateur
    
    user = factory.SubFactory(UserFactory)
    pole = factory.SubFactory(PoleFactory)
    association = factory.SubFactory(AssociationFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.LazyAttribute(lambda obj: obj.user.email)
    is_coordinator = False
    is_active = True


class MentorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Mentor
    
    user = factory.SubFactory(UserFactory)
    pole = factory.SubFactory(PoleFactory)
    association = factory.SubFactory(AssociationFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.LazyAttribute(lambda obj: obj.user.email)
    max_capacity = 3
    disponibilite_reelle = 2
    is_active = True
    is_trained = True


class YoungRequestFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = YoungRequest
    
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.Faker('email')
    city = factory.Faker('city')
    needs_description = factory.Faker('text')
    urgency_level = 2
    status = 'NEW'


class MentoratFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Mentorat
    
    mentor = factory.SubFactory(MentorFactory)
    young_request = factory.SubFactory(YoungRequestFactory)
    pole = factory.LazyAttribute(lambda obj: obj.mentor.pole)
    status = 'ACTIVE'
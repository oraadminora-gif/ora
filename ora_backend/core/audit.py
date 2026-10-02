# core/audit.py
"""
Journal d'audit automatique : qui, quoi, quand, depuis quelle IP, avec les
valeurs avant/après — sans toucher aux vues existantes.

- AuditContextMiddleware garde une référence à la requête en cours (thread-
  local) pour que les signaux post_save/post_delete, qui n'ont pas accès à
  la requête HTTP, puissent retrouver l'utilisateur authentifié et son IP.
- register_audit(model) connecte pre_save/post_save/post_delete sur un
  modèle et écrit une entrée AuditLog à chaque création/modification/
  suppression réelle (silence si rien n'a changé).
"""
import datetime
import decimal
import threading

from django.db.models.signals import pre_save, post_save, post_delete

_local = threading.local()

# Champs trop volumineux/opaques pour être utiles dans un diff — exclus partout.
_EXCLUDED_FIELDS = {'archived_original_data', 'password'}


class AuditContextMiddleware:
    """Garde une référence à la requête en cours pour les signaux du modèle."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _local.request = request
        try:
            return self.get_response(request)
        finally:
            _local.request = None


def get_current_request():
    return getattr(_local, 'request', None)


def get_client_ip(request) -> str | None:
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _actor_repr(user) -> str:
    if not user:
        return 'Anonyme'
    name = f"{user.first_name} {user.last_name}".strip()
    return f"{name} <{user.email}>" if name else str(user.email)


def get_audit_actor():
    """Retourne (user ou None, ip ou None) à partir de la requête en cours."""
    request = get_current_request()
    if request is None:
        return None, None
    user = getattr(request, 'user', None)
    if user is not None and not getattr(user, 'is_authenticated', False):
        user = None
    return user, get_client_ip(request)


def _json_safe(value):
    if isinstance(value, (datetime.date, datetime.datetime, decimal.Decimal)):
        return str(value)
    return value


def _snapshot(instance) -> dict:
    data = {}
    for field in instance._meta.fields:
        if field.name in _EXCLUDED_FIELDS:
            continue
        data[field.name] = _json_safe(field.value_from_object(instance))
    return data


def _resolve_pole(instance):
    """Retrouve le pôle concerné, quel que soit le modèle audité."""
    from core.models import Pole
    if isinstance(instance, Pole):
        return instance
    pole = getattr(instance, 'pole', None)
    if pole is not None:
        return pole
    # Connexion (instance = User) : dérive via l'animateur ou le mentor.
    animateur = getattr(instance, 'animateur', None)
    if animateur is not None:
        return animateur.pole
    mentor = getattr(instance, 'mentor', None)
    if mentor is not None:
        return mentor.pole
    return None


def write_audit_log(action: str, instance, changes: dict, user=None, ip=None):
    from core.models import AuditLog

    if user is None and ip is None:
        user, ip = get_audit_actor()

    pole = _resolve_pole(instance)

    AuditLog.objects.create(
        user=user,
        user_repr=_actor_repr(user),
        pole=pole,
        pole_name=(pole.code or pole.name) if pole else '',
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        object_repr=str(instance)[:255],
        changes=changes,
        ip_address=ip,
    )


def register_audit(model):
    """Connecte pre_save/post_save/post_delete pour journaliser ce modèle."""

    def _pre_save(sender, instance, **kwargs):
        if instance.pk:
            try:
                instance._audit_before = _snapshot(sender.objects.get(pk=instance.pk))
            except sender.DoesNotExist:
                instance._audit_before = None
        else:
            instance._audit_before = None

    def _post_save(sender, instance, created, **kwargs):
        after = _snapshot(instance)
        if created:
            changes = {k: [None, v] for k, v in after.items() if v not in (None, '', [])}
        else:
            before = getattr(instance, '_audit_before', None)
            if before is None:
                return
            changes = {k: [before.get(k), v] for k, v in after.items() if before.get(k) != v}
            if not changes:
                return
        write_audit_log('CREATE' if created else 'UPDATE', instance, changes)

    def _post_delete(sender, instance, **kwargs):
        write_audit_log('DELETE', instance, {})

    pre_save.connect(_pre_save, sender=model, weak=False)
    post_save.connect(_post_save, sender=model, weak=False)
    post_delete.connect(_post_delete, sender=model, weak=False)


def register_all_audited_models():
    from core.models import (
        YoungRequest, Mentorat, Mentor, Animateur, Pole,
        CandidatureMentor, CNMember,
    )
    for model in (YoungRequest, Mentorat, Mentor, Animateur, Pole, CandidatureMentor, CNMember):
        register_audit(model)

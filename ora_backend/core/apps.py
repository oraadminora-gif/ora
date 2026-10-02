from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        import core.signals  # noqa: F401 — connecte les signaux post_save/post_delete
        from core.audit import register_all_audited_models
        register_all_audited_models()

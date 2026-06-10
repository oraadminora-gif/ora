from django.db import migrations, models


def migrate_coordinator_to_acp_ap(apps, schema_editor):
    """
    is_coordinator=True  → is_acp=True, is_ap=False
    is_coordinator=False → is_acp=False, is_ap=True
    """
    Animateur = apps.get_model('core', 'Animateur')
    Animateur.objects.filter(is_coordinator=True).update(is_acp=True, is_ap=False)
    Animateur.objects.filter(is_coordinator=False).update(is_acp=False, is_ap=True)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0020_add_contact_message'),
    ]

    operations = [
        # Ajoute les deux nouveaux champs
        migrations.AddField(
            model_name='animateur',
            name='is_acp',
            field=models.BooleanField(default=False, help_text='Animateur Coordinateur de Pôle'),
        ),
        migrations.AddField(
            model_name='animateur',
            name='is_ap',
            field=models.BooleanField(default=False, help_text='Animateur de Pôle'),
        ),
        # Migration des données
        migrations.RunPython(migrate_coordinator_to_acp_ap, migrations.RunPython.noop),
        # Supprime l'ancien champ
        migrations.RemoveField(
            model_name='animateur',
            name='is_coordinator',
        ),
    ]

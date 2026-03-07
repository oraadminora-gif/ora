from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_cnmember_update_fonctions'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pole',
            name='city',
        ),
        migrations.AddField(
            model_name='pole',
            name='villes',
            field=models.JSONField(blank=True, default=list, help_text='Liste de villes (max 5)'),
        ),
        migrations.AddField(
            model_name='pole',
            name='etat_activite',
            field=models.CharField(
                blank=True,
                choices=[
                    ('a_letude',    "A l'etude"),
                    ('demarre',     'Demarre'),
                    ('fragile',     'Fragile'),
                    ('experimente', 'Experimente'),
                    ('arrete',      'Arrete'),
                ],
                default='',
                max_length=15,
                verbose_name="Etat d'activite",
            ),
        ),
    ]

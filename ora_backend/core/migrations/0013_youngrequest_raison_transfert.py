from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_mentor_code_postal_observations'),
    ]

    operations = [
        migrations.AddField(
            model_name='youngrequest',
            name='raison_transfert',
            field=models.TextField(
                blank=True, default='',
                verbose_name='Raison du transfert',
                help_text='Raison saisie par le pôle qui a transféré cette demande'
            ),
        ),
    ]

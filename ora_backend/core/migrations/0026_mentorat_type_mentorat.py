from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0025_mentorat_suivi_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='mentorat',
            name='type_mentorat',
            field=models.CharField(
                blank=True,
                choices=[('presentiel', 'Présentiel'), ('distanciel', 'Distanciel')],
                help_text='Modalité principale constatée : présentiel ou distanciel',
                max_length=12,
                verbose_name='Type de mentorat',
            ),
        ),
    ]

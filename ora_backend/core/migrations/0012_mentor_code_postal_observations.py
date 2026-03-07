from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_pole_villes_etat_activite'),
    ]

    operations = [
        migrations.AddField(
            model_name='mentor',
            name='code_postal',
            field=models.CharField(blank=True, max_length=10, verbose_name='Code postal'),
        ),
        migrations.AddField(
            model_name='mentor',
            name='observations',
            field=models.TextField(blank=True, default='', verbose_name='Observations'),
        ),
    ]

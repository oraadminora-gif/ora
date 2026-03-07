from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        # ⚠️  Remplace par ton dernier numéro de migration existant
        # Ex : ('core', '0004_add_department_city_to_mentor'),
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SuiviMentorat',
            fields=[
                ('id',               models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_rencontre',   models.DateField(help_text='Date de la rencontre')),
                ('duree_minutes',    models.PositiveIntegerField(default=60, help_text='Durée en minutes')),
                ('type_rencontre',   models.CharField(
                    choices=[
                        ('PRESENTIEL', 'Présentiel'),
                        ('VISIO',      'Visioconférence'),
                        ('TELEPHONE',  'Téléphone'),
                        ('EMAIL',      'Email / Message'),
                    ],
                    default='PRESENTIEL',
                    max_length=20,
                )),
                ('objectifs_atteints', models.BooleanField(default=False, help_text='Objectifs de la rencontre atteints ?')),
                ('notes',            models.TextField(blank=True, help_text='Notes libres sur la rencontre')),
                ('created_at',       models.DateTimeField(auto_now_add=True)),
                ('updated_at',       models.DateTimeField(auto_now=True)),
                ('mentorat',         models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='suivis',
                    to='core.mentorat',
                )),
            ],
            options={
                'db_table': 'suivis_mentorat',
                'ordering': ['-date_rencontre'],
            },
        ),
    ]

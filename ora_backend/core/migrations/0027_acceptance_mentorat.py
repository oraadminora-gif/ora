from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0026_mentorat_type_mentorat'),
    ]

    operations = [
        migrations.CreateModel(
            name='AcceptanceMentorat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=64, unique=True)),
                ('statut', models.CharField(
                    choices=[('PENDING', 'En attente'), ('ACCEPTE', 'Accepté'), ('REFUSE', 'Refusé')],
                    default='PENDING',
                    max_length=10,
                )),
                ('repondu_at', models.DateTimeField(blank=True, null=True)),
                ('email_sent_at', models.DateTimeField(auto_now_add=True)),
                ('mentorat', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='acceptance',
                    to='core.mentorat',
                )),
                ('assigned_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='acceptances_initiees',
                    to='core.animateur',
                )),
            ],
            options={
                'db_table': 'acceptance_mentorats',
            },
        ),
    ]

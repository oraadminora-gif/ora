from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_mentorat_message_cloture'),
    ]

    operations = [
        # ── Champs de demande de clôture sur Mentorat ───────────────
        migrations.AddField(
            model_name='mentorat',
            name='cloture_en_attente',
            field=models.BooleanField(
                default=False,
                help_text="Mentor a demandé la clôture, en attente de confirmation AP",
            ),
        ),
        migrations.AddField(
            model_name='mentorat',
            name='cloture_action_demandee',
            field=models.CharField(
                max_length=10, blank=True,
                help_text="Action demandée : CLOSED ou ABORTED",
            ),
        ),
        migrations.AddField(
            model_name='mentorat',
            name='cloture_reason_demandee',
            field=models.TextField(
                blank=True,
                help_text="Raison soumise par le mentor",
            ),
        ),
        migrations.AddField(
            model_name='mentorat',
            name='cloture_message_demandee',
            field=models.TextField(
                blank=True,
                help_text="Message pour le jeune soumis par le mentor",
            ),
        ),
        # ── Nouveau modèle EvaluationMentor ─────────────────────────
        migrations.CreateModel(
            name='EvaluationMentor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=64, unique=True, help_text="Token secret envoyé par email au jeune")),
                ('rating', models.IntegerField(null=True, blank=True, help_text="Note de 1 à 5")),
                ('comment', models.TextField(blank=True, help_text="Commentaire libre")),
                ('submitted_at', models.DateTimeField(null=True, blank=True, help_text="Date de soumission par le jeune")),
                ('email_sent_at', models.DateTimeField(auto_now_add=True)),
                ('mentorat', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='evaluation',
                    to='core.mentorat',
                )),
            ],
            options={'db_table': 'evaluation_mentors'},
        ),
    ]

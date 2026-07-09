from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0027_acceptance_mentorat'),
    ]

    operations = [
        migrations.AddField(
            model_name='evaluationmentor',
            name='rating_objectifs',
            field=models.IntegerField(
                blank=True, null=True,
                help_text='Tes objectifs personnels ont-ils été atteints ? (1-5)',
            ),
        ),
        migrations.AddField(
            model_name='evaluationmentor',
            name='rating_accompagnement',
            field=models.IntegerField(
                blank=True, null=True,
                help_text="As-tu apprécié la qualité de l'accompagnement par le Mentor ? (1-5)",
            ),
        ),
        migrations.AddField(
            model_name='evaluationmentor',
            name='rating_recommandation',
            field=models.IntegerField(
                blank=True, null=True,
                help_text='Recommanderais-tu ORA à un copain ? (1-5)',
            ),
        ),
        migrations.RemoveField(
            model_name='evaluationmentor',
            name='rating',
        ),
    ]

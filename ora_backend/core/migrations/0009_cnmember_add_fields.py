from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_add_mentorat_problematiques'),
    ]

    operations = [
        migrations.AddField(
            model_name='cnmember',
            name='ville',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='cnmember',
            name='fonction',
            field=models.CharField(
                blank=True,
                choices=[
                    ('membre',         'Membre CN'),
                    ('president',      'Président'),
                    ('vice_president', 'Vice-Président'),
                    ('secretaire',     'Secrétaire Général'),
                    ('tresorier',      'Trésorier'),
                    ('acp',            'Coordinateur de Pôle (ACP)'),
                    ('ap',             'Animateur de Pôle (AP)'),
                    ('mentor',         'Mentor'),
                ],
                default='membre',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='cnmember',
            name='association',
            field=models.ForeignKey(
                blank=True,
                help_text="Association nationale d'appartenance",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cn_members',
                to='core.association',
            ),
        ),
        migrations.AddField(
            model_name='cnmember',
            name='pole',
            field=models.ForeignKey(
                blank=True,
                help_text='Pôle de rattachement (si ACP / AP)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='cn_members',
                to='core.pole',
            ),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_seed_departments_associations'),
    ]

    operations = [
        migrations.AddField(
            model_name='mentorat',
            name='problematiques',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Liste de codes (max 3) parmi les problématiques prédéfinies",
            ),
        ),
    ]

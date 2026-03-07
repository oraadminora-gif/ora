from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_youngrequest_raison_transfert'),
    ]

    operations = [
        migrations.AddField(
            model_name='mentorat',
            name='message_cloture',
            field=models.TextField(blank=True, help_text="Message envoyé au jeune lors de la clôture"),
        ),
    ]

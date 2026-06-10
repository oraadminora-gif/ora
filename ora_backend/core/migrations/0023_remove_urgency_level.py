from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0022_alter_mentorat_ap_responsable'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='youngrequest',
            name='urgency_level',
        ),
    ]

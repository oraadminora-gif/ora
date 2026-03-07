#core/models/matching_audit.py
from django.db import models


class MatchingDecision(models.Model):
    """
    Audit des décisions de matching (IA + override humain)
    """
    young_request = models.ForeignKey(
        'YoungRequest',
        on_delete=models.CASCADE,
        related_name='matching_decisions'
    )
    mentor = models.ForeignKey(
        'Mentor',
        on_delete=models.CASCADE,
        related_name='matching_decisions'
    )
    decided_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='matching_decisions_taken'
    )
    
    # Scoring
    ai_score = models.IntegerField(default=0, help_text="Score de matching IA (0-100)")
    overridden = models.BooleanField(default=False, help_text="True si humain a outrepassé IA")
    justification = models.TextField(blank=True, help_text="Raison de la décision")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'matching_decisions'
        ordering = ['-created_at']
    
    def __str__(self):
        status = " (override)" if self.overridden else ""
        return f"{self.young_request} → {self.mentor} ({self.ai_score}%){status}"
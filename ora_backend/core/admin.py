# core/admin.py
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html


# ── Formulaire personnalisé pour Pole ─────────────────────────────
class PoleAdminForm(forms.ModelForm):
    villes_input = forms.CharField(
        label='Villes',
        required=False,
        widget=forms.TextInput(attrs={
            'placeholder': 'Ex: Bordeaux, Libourne, Mérignac',
            'style': 'width: 100%;',
        }),
        help_text='Séparez les villes par une virgule (maximum 5).',
    )

    class Meta:
        from core.models import Pole
        model = Pole
        exclude = ['villes']  # géré via villes_input

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Pré-remplit le champ texte depuis la liste JSON existante
        if self.instance and self.instance.pk:
            villes = self.instance.villes or []
            self.fields['villes_input'].initial = ', '.join(villes)

    def clean_villes_input(self):
        raw = self.cleaned_data.get('villes_input', '')
        villes = [v.strip() for v in raw.split(',') if v.strip()]
        if len(villes) > 5:
            raise forms.ValidationError('Maximum 5 villes autorisées.')
        return villes

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.villes = self.cleaned_data.get('villes_input', [])
        if commit:
            instance.save()
            self._save_m2m()
        return instance

from core.models import (
    SuiviMentorat, User, Pole, Department, Association,
    Animateur, Mentor, YoungRequest, Mentorat,
    CNMember, MatchingDecision, Etablissement, Financement, MentoratFinancement
)

# ══════════════════════════════════════════════════════════════════
#  Identité du site admin
# ══════════════════════════════════════════════════════════════════
admin.site.site_header  = 'Administration ORA'
admin.site.site_title   = 'ORA Admin'
admin.site.index_title  = 'Tableau de bord — Plateforme de mentorat'


# ══════════════════════════════════════════════════════════════════
#  COMPTES UTILISATEURS
# ══════════════════════════════════════════════════════════════════
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering       = ('email',)
    list_display   = ('email', 'full_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    list_filter    = ('is_staff', 'is_superuser', 'is_active')
    search_fields  = ('email', 'first_name', 'last_name')
    list_per_page  = 30

    fieldsets = (
        (None,                    {'fields': ('email', 'password')}),
        ('Informations',          {'fields': ('first_name', 'last_name')}),
        ('Permissions',           {'fields': ('is_staff', 'is_superuser', 'is_active',
                                              'groups', 'user_permissions')}),
        ('Dates',                 {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_superuser', 'is_active'),
        }),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or '—'
    full_name.short_description = 'Nom complet'


# ══════════════════════════════════════════════════════════════════
#  RÉFÉRENTIEL GÉOGRAPHIQUE & ORGANISATIONNEL
# ══════════════════════════════════════════════════════════════════
@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display  = ('code', 'name')
    search_fields = ('code', 'name')
    ordering      = ('code',)
    list_per_page = 50


@admin.register(Association)
class AssociationAdmin(admin.ModelAdmin):
    list_display  = ('code', 'name', 'statut_badge', 'created_at')
    list_filter   = ('is_active',)
    search_fields = ('code', 'name')
    ordering      = ('code',)
    list_per_page = 20

    def statut_badge(self, obj):
        color = '#28a745' if obj.is_active else '#6c757d'
        label = 'Active' if obj.is_active else 'Inactive'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.75rem;font-weight:600;">{}</span>',
            color, label
        )
    statut_badge.short_description = 'Statut'


@admin.register(Pole)
class PoleAdmin(admin.ModelAdmin):
    form           = PoleAdminForm
    list_display   = ('code', 'name', 'statut_badge', 'etat_badge', 'villes_display',
                      'contact_email', 'animateurs_count', 'mentors_count')
    list_filter    = ('status', 'etat_activite')
    search_fields  = ('code', 'name')
    ordering       = ('code',)
    list_per_page  = 20
    filter_horizontal = ('departments',)

    fieldsets = (
        ('Identité', {
            'fields': ('code', 'name', 'status', 'etat_activite')
        }),
        ('Localisation', {
            'fields': ('villes_input', 'departments')
        }),
        ('Contact', {
            'fields': ('contact_email', 'contact_phone')
        }),
    )

    # ── Méthodes d'affichage ───────────────────────────────────
    ETAT_COLORS = {
        'a_letude':    ('#0ea5e9', '#fff'),
        'demarre':     ('#22c55e', '#fff'),
        'fragile':     ('#f59e0b', '#fff'),
        'experimente': ('#8b5cf6', '#fff'),
        'arrete':      ('#ef4444', '#fff'),
    }

    def statut_badge(self, obj):
        ok = obj.status == 'ACTIVE'
        bg = '#22c55e' if ok else '#9ca3af'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.72rem;font-weight:700;">{}</span>',
            bg, 'Actif' if ok else 'Inactif'
        )
    statut_badge.short_description = 'Statut'

    def etat_badge(self, obj):
        if not obj.etat_activite:
            return '—'
        bg, fg = self.ETAT_COLORS.get(obj.etat_activite, ('#6b7280', '#fff'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:12px;'
            'font-size:0.72rem;font-weight:600;">{}</span>',
            bg, fg, obj.get_etat_activite_display()
        )
    etat_badge.short_description = "État d'activité"

    def villes_display(self, obj):
        villes = obj.villes if isinstance(obj.villes, list) else []
        return ', '.join(villes) if villes else '—'
    villes_display.short_description = 'Villes'

    def animateurs_count(self, obj):
        return obj.animateurs.count()
    animateurs_count.short_description = 'Anim.'

    def mentors_count(self, obj):
        return obj.mentors.count()
    mentors_count.short_description = 'Mentors'


# ══════════════════════════════════════════════════════════════════
#  MEMBRES CN
# ══════════════════════════════════════════════════════════════════
@admin.register(CNMember)
class CNMemberAdmin(admin.ModelAdmin):
    list_display   = ('full_name', 'fonction_badge', 'email', 'ville',
                      'association', 'pole', 'statut_badge', 'is_super_admin', 'cn_acces_complet', 'created_at')
    list_filter    = ('is_active', 'is_super_admin', 'cn_acces_complet', 'fonction', 'association', 'pole')
    search_fields  = ('first_name', 'last_name', 'email', 'ville')
    ordering       = ('last_name', 'first_name')
    list_per_page  = 25

    FONCTION_COLORS = {
        'membre':       '#6b7280',
        'resp_anim':    '#003DA5',
        'resp_reseau':  '#0ea5e9',
        'resp_doc':     '#8b5cf6',
        'resp_finance': '#f59e0b',
        'resp_com':     '#ec4899',
        'resp_si':      '#14b8a6',
    }

    fieldsets = (
        ('Identité', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'ville')
        }),
        ('Rôle & Responsabilité', {
            'fields': ('fonction', 'association', 'pole')
        }),
        ('Statut', {
            'fields': ('is_active', 'is_super_admin', 'cn_acces_complet')
        }),
        ('Compte lié', {
            'fields': ('user',),
            'classes': ('collapse',)
        }),
    )

    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Nom complet'

    def fonction_badge(self, obj):
        if not obj.fonction:
            return '—'
        color = self.FONCTION_COLORS.get(obj.fonction, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.7rem;font-weight:600;">{}</span>',
            color, obj.get_fonction_display()
        )
    fonction_badge.short_description = 'Fonction'

    def statut_badge(self, obj):
        ok = obj.is_active
        bg = '#22c55e' if ok else '#9ca3af'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 6px;border-radius:12px;'
            'font-size:0.7rem;font-weight:600;">{}</span>',
            bg, 'Actif' if ok else 'Inactif'
        )
    statut_badge.short_description = 'Statut'


# ══════════════════════════════════════════════════════════════════
#  ANIMATEURS (ACP / AP)
# ══════════════════════════════════════════════════════════════════
@admin.register(Animateur)
class AnimateurAdmin(admin.ModelAdmin):
    list_display  = ('full_name', 'role_badge', 'pole', 'association', 'email', 'statut_badge')
    list_filter   = ('is_coordinator', 'is_active', 'pole', 'association')
    search_fields = ('first_name', 'last_name', 'email')
    ordering      = ('pole__code', 'last_name')
    list_per_page = 30

    fieldsets = (
        ('Identité',      {'fields': ('first_name', 'last_name', 'email', 'phone', 'city')}),
        ('Organisation',  {'fields': ('pole', 'association', 'is_coordinator')}),
        ('Statut',        {'fields': ('is_active',)}),
        ('Compte',        {'fields': ('user',), 'classes': ('collapse',)}),
    )

    def role_badge(self, obj):
        label = 'ACP' if obj.is_coordinator else 'AP'
        color = '#003DA5' if obj.is_coordinator else '#8b5cf6'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.72rem;font-weight:700;">{}</span>',
            color, label
        )
    role_badge.short_description = 'Rôle'

    def statut_badge(self, obj):
        bg = '#22c55e' if obj.is_active else '#9ca3af'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 6px;border-radius:12px;'
            'font-size:0.7rem;font-weight:600;">{}</span>',
            bg, 'Actif' if obj.is_active else 'Inactif'
        )
    statut_badge.short_description = 'Statut'


# ══════════════════════════════════════════════════════════════════
#  MENTORS
# ══════════════════════════════════════════════════════════════════
@admin.register(Mentor)
class MentorAdmin(admin.ModelAdmin):
    list_display  = ('full_name', 'pole', 'association', 'disponibilite_reelle',
                     'max_capacity', 'is_trained', 'training_date', 'statut_badge')
    list_filter   = ('is_active', 'is_trained', 'pole', 'association')
    search_fields = ('first_name', 'last_name', 'email')
    ordering      = ('pole__code', 'last_name')
    list_per_page = 30
    date_hierarchy = 'training_date'

    fieldsets = (
        ('Informations',  {'fields': ('user', 'first_name', 'last_name', 'email', 'phone')}),
        ('Localisation',  {'fields': ('city', 'code_postal', 'department')}),
        ('Organisation',  {'fields': ('pole', 'association')}),
        ('Capacité',      {'fields': ('max_capacity', 'disponibilite_reelle')}),
        ('Formation',     {'fields': ('is_trained', 'training_date'),
                           'description': 'La date de formation alimente le critère «&nbsp;formation récente&nbsp;» '
                                          'dans l\'algorithme de matching.'}),
        ('Statut',        {'fields': ('is_active',)}),
        ('Observations',  {'fields': ('observations',)}),
    )

    def statut_badge(self, obj):
        bg = '#22c55e' if obj.is_active else '#9ca3af'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 6px;border-radius:12px;'
            'font-size:0.7rem;font-weight:600;">{}</span>',
            bg, 'Actif' if obj.is_active else 'Inactif'
        )
    statut_badge.short_description = 'Statut'


# ══════════════════════════════════════════════════════════════════
#  DEMANDES JEUNES
# ══════════════════════════════════════════════════════════════════
@admin.register(YoungRequest)
class YoungRequestAdmin(admin.ModelAdmin):
    list_display   = ('full_name', 'status_badge', 'pole', 'diplome_prepare',
                      'situation_display', 'urgency_display', 'created_at')
    list_filter    = ('status', 'gender', 'pole', 'diplome_prepare', 'situation', 'urgency_level')
    search_fields  = ('first_name', 'last_name', 'email', 'city', 'nom_etablissement')
    ordering       = ('-created_at',)
    date_hierarchy = 'created_at'
    list_per_page  = 25

    STATUS_COLORS = {
        'NEW':     ('#0ea5e9', 'Nouveau'),
        'PENDING': ('#f59e0b', 'En attente'),
        'MATCHED': ('#22c55e', 'Apparié'),
        'CLOSED':  ('#6b7280', 'Clôturé'),
    }

    fieldsets = (
        ('Jeune',                    {'fields': ('first_name', 'last_name', 'email', 'phone', 'birth_date', 'gender')}),
        ('Localisation',             {'fields': ('city', 'department', 'pole')}),
        ('Établissement & Formation',{'fields': ('nom_etablissement', 'etablissement', 'diplome_prepare', 'situation')}),
        ('Demande',                  {'fields': ('needs_description', 'urgency_level', 'status')}),
    )

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    full_name.short_description = 'Jeune'

    def status_badge(self, obj):
        color, label = self.STATUS_COLORS.get(obj.status, ('#6b7280', obj.status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.72rem;font-weight:600;">{}</span>',
            color, label
        )
    status_badge.short_description = 'Statut'

    URGENCY_COLORS = {1: '#22c55e', 2: '#f59e0b', 3: '#ef4444'}
    URGENCY_LABELS = {1: 'Faible', 2: 'Moyen', 3: 'Urgent'}

    def urgency_display(self, obj):
        color = self.URGENCY_COLORS.get(obj.urgency_level, '#6b7280')
        label = self.URGENCY_LABELS.get(obj.urgency_level, str(obj.urgency_level))
        return format_html(
            '<span style="color:{};font-weight:700;">● {}</span>', color, label
        )
    urgency_display.short_description = 'Urgence'

    def situation_display(self, obj):
        if obj.situation == 'apprentissage':
            return format_html('<span style="color:#003DA5;">En apprentissage</span>')
        if obj.situation == 'recherche':
            return format_html('<span style="color:#f59e0b;">En recherche</span>')
        return '—'
    situation_display.short_description = 'Situation'


# ══════════════════════════════════════════════════════════════════
#  MENTORATS
# ══════════════════════════════════════════════════════════════════
@admin.register(Mentorat)
class MentoratAdmin(admin.ModelAdmin):
    list_display   = ('id', 'mentor_name', 'jeune_name', 'pole',
                      'status_badge', 'alerte_display', 'assigned_at')
    list_filter    = ('status', 'alerte_rouge', 'pole')
    search_fields  = ('mentor__first_name', 'mentor__last_name',
                      'young_request__first_name', 'young_request__last_name')
    ordering       = ('-created_at',)
    list_per_page  = 25

    STATUS_COLORS = {
        'PENDING': ('#f59e0b', 'En attente'),
        'ACTIVE':  ('#22c55e', 'Actif'),
        'CLOSED':  ('#6b7280', 'Clôturé'),
        'ABORTED': ('#ef4444', 'Abandonné'),
    }

    fieldsets = (
        ('Relations',  {'fields': ('mentor', 'young_request', 'pole', 'ap_responsable')}),
        ('Dates',      {'fields': ('assigned_at', 'expected_end_date', 'closed_at')}),
        ('Statut',     {'fields': ('status', 'closure_reason')}),
        ('Suivi',      {'fields': ('alerte_rouge', 'dernier_contact', 'notes_suivi', 'problematiques')}),
    )

    def mentor_name(self, obj):
        return obj.mentor.full_name if obj.mentor else '—'
    mentor_name.short_description = 'Mentor'

    def jeune_name(self, obj):
        if obj.young_request:
            return f"{obj.young_request.first_name} {obj.young_request.last_name}"
        return '—'
    jeune_name.short_description = 'Jeune'

    def status_badge(self, obj):
        color, label = self.STATUS_COLORS.get(obj.status, ('#6b7280', obj.status))
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.72rem;font-weight:600;">{}</span>',
            color, label
        )
    status_badge.short_description = 'Statut'

    def alerte_display(self, obj):
        if obj.alerte_rouge:
            return format_html('<span style="color:#ef4444;font-weight:700;">🔴 Alerte</span>')
        return format_html('<span style="color:#9ca3af;">—</span>')
    alerte_display.short_description = 'Alerte'


# ══════════════════════════════════════════════════════════════════
#  DÉCISIONS DE MATCHING
# ══════════════════════════════════════════════════════════════════
@admin.register(MatchingDecision)
class MatchingDecisionAdmin(admin.ModelAdmin):
    list_display  = ('id', 'jeune_name', 'mentor_name', 'decided_by',
                     'score_display', 'overridden', 'created_at')
    list_filter   = ('overridden',)
    search_fields = ('young_request__first_name', 'young_request__last_name',
                     'mentor__first_name', 'mentor__last_name')
    ordering      = ('-created_at',)
    list_per_page = 25

    def jeune_name(self, obj):
        if obj.young_request:
            return f"{obj.young_request.first_name} {obj.young_request.last_name}"
        return '—'
    jeune_name.short_description = 'Jeune'

    def mentor_name(self, obj):
        return obj.mentor.full_name if obj.mentor else '—'
    mentor_name.short_description = 'Mentor'

    def score_display(self, obj):
        score = obj.ai_score or 0
        color = '#22c55e' if score >= 70 else '#f59e0b' if score >= 40 else '#ef4444'
        return format_html(
            '<strong style="color:{};">{} %</strong>', color, int(score)
        )
    score_display.short_description = 'Score IA'


# ══════════════════════════════════════════════════════════════════
#  ÉTABLISSEMENTS & FINANCEMENTS
# ══════════════════════════════════════════════════════════════════
@admin.register(Etablissement)
class EtablissementAdmin(admin.ModelAdmin):
    list_display  = ('nom', 'code_postal', 'pole', 'statut_badge', 'created_at')
    list_filter   = ('is_active', 'pole')
    search_fields = ('nom', 'code_postal')
    ordering      = ('pole__code', 'nom')
    list_per_page = 30

    def statut_badge(self, obj):
        bg = '#22c55e' if obj.is_active else '#9ca3af'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 6px;border-radius:12px;'
            'font-size:0.7rem;font-weight:600;">{}</span>',
            bg, 'Actif' if obj.is_active else 'Inactif'
        )
    statut_badge.short_description = 'Statut'


@admin.register(Financement)
class FinancementAdmin(admin.ModelAdmin):
    list_display  = ('code', 'nom', 'type_badge')
    list_filter   = ('type',)
    search_fields = ('code', 'nom')
    ordering      = ('code',)
    list_per_page = 30

    def type_badge(self, obj):
        color = '#003DA5' if obj.type == 'national' else '#8b5cf6'
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:12px;'
            'font-size:0.72rem;font-weight:600;">{}</span>',
            color, obj.get_type_display()
        )
    type_badge.short_description = 'Type'


@admin.register(MentoratFinancement)
class MentoratFinancementAdmin(admin.ModelAdmin):
    list_display  = ('mentorat', 'financement', 'code_specifique', 'added_at')
    list_filter   = ('financement__type',)
    search_fields = ('code_specifique', 'financement__nom')
    ordering      = ('-added_at',)
    list_per_page = 30


# ══════════════════════════════════════════════════════════════════
#  SUIVI MENTORAT
# ══════════════════════════════════════════════════════════════════
@admin.register(SuiviMentorat)
class SuiviMentoratAdmin(admin.ModelAdmin):
    list_display   = ('id', 'mentorat_info', 'date_rencontre', 'duree_minutes',
                      'type_rencontre', 'objectifs_atteints', 'created_at')
    list_filter    = ('type_rencontre', 'objectifs_atteints', 'date_rencontre')
    search_fields  = ('mentorat__mentor__first_name', 'mentorat__mentor__last_name',
                      'mentorat__young_request__first_name', 'mentorat__young_request__last_name',
                      'notes')
    ordering       = ('-date_rencontre', '-created_at')
    date_hierarchy = 'date_rencontre'
    list_per_page  = 30
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ['mentorat']

    fieldsets = (
        ('Mentorat',     {'fields': ('mentorat',)}),
        ('Rencontre',    {'fields': ('date_rencontre', 'duree_minutes', 'type_rencontre')}),
        ('Évaluation',   {'fields': ('objectifs_atteints', 'notes')}),
        ('Métadonnées',  {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def mentorat_info(self, obj):
        mentor = obj.mentorat.mentor.full_name if obj.mentorat.mentor else 'Inconnu'
        jeune  = (
            f"{obj.mentorat.young_request.first_name} {obj.mentorat.young_request.last_name}"
            if obj.mentorat.young_request else 'Inconnu'
        )
        return format_html('<strong>{}</strong> &rarr; {}', mentor, jeune)
    mentorat_info.short_description = 'Mentorat (Mentor → Jeune)'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('mentorat', 'mentorat__mentor', 'mentorat__young_request')

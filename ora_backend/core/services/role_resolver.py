# core/services/role_resolver.py

class RoleResolver:

    ROLE_CN = "CN"
    ROLE_ACP = "ACP"
    ROLE_AP = "AP"
    ROLE_MENTOR = "MENTOR"

    PRIORITY = [ROLE_CN, ROLE_ACP, ROLE_AP, ROLE_MENTOR]

    def __init__(self, user):
        self.user = user

    def get_roles(self):
        roles = []

        if self._is_cn():
            roles.append(self.ROLE_CN)

        if self._is_animateur():
            anim = self.user.animateur
            if anim.is_acp:
                roles.append(self.ROLE_ACP)
            if anim.is_ap or anim.is_acp:
                if self.ROLE_AP not in roles:
                    roles.append(self.ROLE_AP)

        if self._is_mentor():
            roles.append(self.ROLE_MENTOR)

        return roles

    def get_active_role(self, roles):
        return next(
            (r for r in self.PRIORITY if r in roles),
            roles[0] if roles else "UNKNOWN"
        )

    def get_pole_id(self):
        if self._is_animateur():
            return self.user.animateur.pole_id

        if self._is_mentor():
            return self.user.mentor.pole_id

        return None

    # --------------------------
    # PRIVATE CHECKS (safe)
    # --------------------------

    def _is_cn(self):
        return hasattr(self.user, "cn_member") and self.user.cn_member.is_active

    def _is_animateur(self):
        return hasattr(self.user, "animateur") and self.user.animateur.is_active

    def _is_mentor(self):
        return hasattr(self.user, "mentor") and self.user.mentor.is_active

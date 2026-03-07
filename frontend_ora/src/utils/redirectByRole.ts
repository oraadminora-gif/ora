// src/utils/redirectByRole.ts
import type { UserRole } from '../contexts/AuthContext';

export function redirectByRole(role: UserRole): string {
  switch (role) {
    case 'MENTOR':
      return '/member/mentor/dashboard';

    case 'AP':
      return '/member/ap/dashboard';

    case 'ACP':
      return '/member/acp/dashboard';

    case 'CN':
      return '/member/cn/dashboard';

    default:
      return '/member';
  }
}
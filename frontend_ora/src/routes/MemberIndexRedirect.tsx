// src/routes/MemberIndexRedirect.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { redirectByRole } from '../utils/redirectByRole';

export function MemberIndexRedirect() {
  const { activeRole } = useAuth();
  
  return <Navigate to={redirectByRole(activeRole)} replace />;
}
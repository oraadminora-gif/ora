// src/pages/TestDebug.tsx
import { useAuth } from '../contexts/AuthContext';

export function TestDebug() {
  const { user, activeRole, loading, isAuthenticated } = useAuth();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Page de Debug Auth</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h2 className="font-semibold text-lg mb-2">État Auth</h2>
          <pre className="bg-slate-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify({
              loading,
              isAuthenticated,
              activeRole,
              user: {
                id: user?.id,
                email: user?.email,
                role: user?.role,
                roles: user?.roles,
                first_name: user?.first_name,
                last_name: user?.last_name,
              }
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h2 className="font-semibold text-lg mb-2 text-purple-900">Test Header ACP</h2>
          <p className="text-purple-700">
            Si activeRole = "ACP", tu devrais voir le header violet ci-dessus.
          </p>
          <p className="text-2xl font-bold mt-2 text-purple-600">
            Rôle actuel: {activeRole || 'NON DÉFINI'}
          </p>
        </div>
      </div>
    </div>
  );
}
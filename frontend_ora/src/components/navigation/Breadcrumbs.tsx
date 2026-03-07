import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

export function Breadcrumbs() {
  const { pathname } = useLocation();

  // Pas de breadcrumb sur la home
  if (pathname === '/') return null;

  const routeEntries = Object.values(ROUTES);
  const pathSegments = pathname.split('/').filter(Boolean);

  const crumbs = pathSegments
    .map((_, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');

      const route = routeEntries.find(
        (r) => r.path === path
      );

      return route
        ? { path: route.path, label: route.label }
        : null;
    })
    .filter(Boolean);

  return (
    <nav className="bg-slate-50 border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-slate-600 flex gap-2">
        <Link to="/" className="hover:text-ora-blue">
          Accueil
        </Link>

        {crumbs.map((crumb, index) => (
          <span key={crumb!.path} className="flex gap-2">
            <span>/</span>

            {index === crumbs.length - 1 ? (
              <span className="font-semibold text-slate-900">
                {crumb!.label}
              </span>
            ) : (
              <Link
                to={crumb!.path}
                className="hover:text-ora-blue"
              >
                {crumb!.label}
              </Link>
            )}
          </span>
        ))}
      </div>
    </nav>
  );
}

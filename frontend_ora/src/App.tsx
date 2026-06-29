import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { MemberLayout } from './layouts/MemberLayout';
import { ProtectedRoute, ProtectedCNAdminRoute } from './routes/ProtectedRoute';
import { MemberIndexRedirect } from './routes/MemberIndexRedirect';

// ── Pages publiques — import statique (légères, navigation instantanée) ──
import { Home }                    from './pages/Home';
import { AboutORA }                from './pages/AboutORA';
import { ApprenticeInfo }          from './pages/ApprenticeInfo';
import { ApprenticeRegistration }  from './pages/ApprenticeRegistration';
import { BecomeMentor }            from './pages/BecomeMentor';
import { MentorRegistration }      from './pages/MentorRegistration';
import { FAQ }                     from './pages/FAQ';
import { Testimonials }            from './pages/Testimonials';
import { Partners }                from './pages/Partners';
import { Implantations }           from './pages/Implantations';
import { Contact }                 from './pages/Contact';
import { MentionsLegales }         from './pages/MentionsLegales';
import { PolitiqueConfidentialite } from './pages/PolitiqueConfidentialite';
import { CGV }                     from './pages/CGV';
import { Login }                   from './pages/Login';
import { NotFound }                from './pages/NotFound';
import { EvaluationPage }          from './pages/EvaluationPage';
import { CharteGraphique }         from './pages/CharteGraphique';

// ── Dashboards membres — lazy (lourds, chargés seulement après login) ──
const MentorDashboard           = lazy(() => import('./pages/member/mentor/MentorDashboard').then(m => ({ default: m.MentorDashboard })));
const MentorMentorats           = lazy(() => import('./pages/member/mentor/MentorMentorats').then(m => ({ default: m.MentorMentorats })));
const PoleDashboard             = lazy(() => import('./pages/member/pole/PoleDashboard').then(m => ({ default: m.PoleDashboard })));
const MatchingBoard             = lazy(() => import('./pages/member/pole/MatchingBoard').then(m => ({ default: m.MatchingBoard })));
const PoleKPIs                  = lazy(() => import('./pages/member/pole/PoleKPIs').then(m => ({ default: m.PoleKPIs })));
const APMesMentorats            = lazy(() => import('./pages/member/ap/APMesMentorats').then(m => ({ default: m.APMesMentorats })));
const ACPDashboard              = lazy(() => import('./pages/member/acp/ACPDashboard').then(m => ({ default: m.ACPDashboard })));
const GestionMentors            = lazy(() => import('./pages/member/acp/GestionMentors').then(m => ({ default: m.GestionMentors })));
const GestionAnimateurs         = lazy(() => import('./pages/member/acp/GestionAnimateurs').then(m => ({ default: m.GestionAnimateurs })));
const GestionMentorats          = lazy(() => import('./pages/member/acp/GestionMentorats').then(m => ({ default: m.GestionMentorats })));
const AnnuairePole              = lazy(() => import('./pages/member/acp/AnnuairePole').then(m => ({ default: m.AnnuairePole })));
const CNDashboard               = lazy(() => import('./pages/member/cn/CNDashboard').then(m => ({ default: m.CNDashboard })));
const CNMentors                 = lazy(() => import('./pages/member/cn/CNMentors').then(m => ({ default: m.CNMentors })));
const CNPoles                   = lazy(() => import('./pages/member/cn/CNPoles').then(m => ({ default: m.CNPoles })));
const GestionAnimateursNational = lazy(() => import('./pages/member/cn/GestionAnimateursNational').then(m => ({ default: m.GestionAnimateursNational })));
const AnnuaireORA               = lazy(() => import('./pages/member/cn/AnnuaireORA').then(m => ({ default: m.AnnuaireORA })));
const NationalKPIs              = lazy(() => import('./pages/member/cn/NationalKPIs').then(m => ({ default: m.NationalKPIs })));
const CNConfiguration           = lazy(() => import('./pages/member/cn/CNConfiguration').then(m => ({ default: m.CNConfiguration })));
const ImplantationsPoles        = lazy(() => import('./pages/member/cn/ImplantationsPoles').then(m => ({ default: m.ImplantationsPoles })));
const RetributionCN             = lazy(() => import('./pages/member/cn/RetributionCN').then(m => ({ default: m.RetributionCN })));
const CNMessages                = lazy(() => import('./pages/member/cn/CNMessages').then(m => ({ default: m.CNMessages })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Spinner centré uniquement pour les dashboards membres
function DashboardLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-ora-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PublicLayoutWrapper() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>

          {/* ── ROUTES PUBLIQUES — pas de Suspense, navigation instantanée ── */}
          <Route element={<PublicLayoutWrapper />}>
            <Route path="/"                          element={<Home />} />
            <Route path="/ora"                       element={<AboutORA />} />
            <Route path="/apprentis"                 element={<ApprenticeInfo />} />
            <Route path="/apprentis/inscription"     element={<ApprenticeRegistration />} />
            <Route path="/mentors"                   element={<BecomeMentor />} />
            <Route path="/mentors/inscription"       element={<MentorRegistration />} />
            <Route path="/faq"                       element={<FAQ />} />
            <Route path="/temoignages"               element={<Testimonials />} />
            <Route path="/partenaires"               element={<Partners />} />
            <Route path="/implantations"             element={<Implantations />} />
            <Route path="/contact"                   element={<Contact />} />
            <Route path="/mentions-legales"          element={<MentionsLegales />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
            <Route path="/cgv"                       element={<CGV />} />
            <Route path="/charte"                    element={<CharteGraphique />} />
            <Route path="/login"                     element={<Login />} />
            <Route path="/evaluer-mentor/:token"     element={<EvaluationPage />} />
          </Route>

          {/* ── ROUTES MEMBRES — Suspense sur la zone contenu uniquement ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/member" element={<MemberLayout />}>

              <Route index element={<MemberIndexRedirect />} />

              <Route element={<ProtectedRoute allowedRoles={['MENTOR']} />}>
                <Route path="mentor/dashboard"  element={<Suspense fallback={<DashboardLoader />}><MentorDashboard /></Suspense>} />
                <Route path="mentor/mentorats"  element={<Suspense fallback={<DashboardLoader />}><MentorMentorats /></Suspense>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['AP', 'ACP', 'CN']} />}>
                <Route path="ap/dashboard"  element={<Suspense fallback={<DashboardLoader />}><ACPDashboard /></Suspense>} />
                <Route path="ap/mentorats"  element={<Suspense fallback={<DashboardLoader />}><APMesMentorats /></Suspense>} />
                <Route path="acp/mentors"   element={<Suspense fallback={<DashboardLoader />}><GestionMentors /></Suspense>} />
                <Route path="acp/annuaire"  element={<Suspense fallback={<DashboardLoader />}><AnnuairePole /></Suspense>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ACP', 'CN']} />}>
                <Route path="acp/dashboard"  element={<Suspense fallback={<DashboardLoader />}><ACPDashboard /></Suspense>} />
                <Route path="acp/animateurs" element={<Suspense fallback={<DashboardLoader />}><GestionAnimateurs /></Suspense>} />
                <Route path="acp/mentorats"  element={<Suspense fallback={<DashboardLoader />}><GestionMentorats /></Suspense>} />
                <Route path="pole/dashboard" element={<Suspense fallback={<DashboardLoader />}><PoleDashboard /></Suspense>} />
                <Route path="matching"       element={<Suspense fallback={<DashboardLoader />}><MatchingBoard /></Suspense>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['AP', 'ACP', 'CN']} />}>
                <Route path="pole/kpi"       element={<Suspense fallback={<DashboardLoader />}><PoleKPIs /></Suspense>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['CN']} />}>
                <Route path="cn/dashboard"     element={<Suspense fallback={<DashboardLoader />}><CNDashboard /></Suspense>} />
                <Route path="cn/annuaire"      element={<Suspense fallback={<DashboardLoader />}><AnnuaireORA /></Suspense>} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['AP', 'ACP', 'CN']} />}>
                <Route path="cn/implantations" element={<Suspense fallback={<DashboardLoader />}><ImplantationsPoles /></Suspense>} />
                <Route path="cn/kpis"          element={<Suspense fallback={<DashboardLoader />}><NationalKPIs /></Suspense>} />
              </Route>

              <Route element={<ProtectedCNAdminRoute />}>
                <Route path="cn/retribution"   element={<Suspense fallback={<DashboardLoader />}><RetributionCN /></Suspense>} />
                <Route path="cn/mentors"       element={<Suspense fallback={<DashboardLoader />}><CNMentors /></Suspense>} />
                <Route path="cn/messages"      element={<Suspense fallback={<DashboardLoader />}><CNMessages /></Suspense>} />
                <Route path="cn/poles"         element={<Suspense fallback={<DashboardLoader />}><CNPoles /></Suspense>} />
                <Route path="cn/animateurs"    element={<Suspense fallback={<DashboardLoader />}><GestionAnimateursNational /></Suspense>} />
                <Route path="cn/configuration" element={<Suspense fallback={<DashboardLoader />}><CNConfiguration /></Suspense>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

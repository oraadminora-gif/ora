// App.tsx
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { AuthProvider } from './contexts/AuthContext';

import { PublicLayout } from './layouts/PublicLayout';
import { MemberLayout } from './layouts/MemberLayout';

import { Home } from './pages/Home';
import { AboutORA } from './pages/AboutORA';
import { BecomeMentor } from './pages/BecomeMentor';
import { FAQ } from './pages/FAQ';
import { Testimonials } from './pages/Testimonials';
import { Partners } from './pages/Partners';
import { Implantations } from './pages/Implantations';
import { News } from './pages/News';
import { Contact } from './pages/Contact';
import { ApprenticeInfo } from './pages/ApprenticeInfo';
import { ApprenticeRegistration } from './pages/ApprenticeRegistration';
import { MentorRegistration } from './pages/MentorRegistration';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { TestDebug } from './pages/TestDebug';
import { EvaluationPage } from './pages/EvaluationPage';

// Dashboards membres
import { MentorDashboard } from './pages/member/mentor/MentorDashboard';
import { PoleDashboard } from './pages/member/pole/PoleDashboard';
import { MatchingBoard } from './pages/member/pole/MatchingBoard';
import { PoleKPIs } from './pages/member/pole/PoleKPIs';
import { CNDashboard } from './pages/member/cn/CNDashboard';
import { CNMentors } from './pages/member/cn/CNMentors';
import { CNPoles } from './pages/member/cn/CNPoles';
import { GestionAnimateursNational } from './pages/member/cn/GestionAnimateursNational';
import { AnnuaireORA } from './pages/member/cn/AnnuaireORA';
import { NationalKPIs } from './pages/member/cn/NationalKPIs';
import { CNConfiguration } from './pages/member/cn/CNConfiguration';
import { ImplantationsPoles } from './pages/member/cn/ImplantationsPoles';
import { RetributionCN } from './pages/member/cn/RetributionCN';
import { CNMessages } from './pages/member/cn/CNMessages';

import { APDashboard } from './pages/member/ap/APDashboard';
import { ACPDashboard } from './pages/member/acp/ACPDashboard';
import { GestionMentors } from './pages/member/acp/GestionMentors';
import { GestionAnimateurs } from './pages/member/acp/GestionAnimateurs';
import { GestionMentorats } from './pages/member/acp/GestionMentorats';
import { AnnuairePole } from './pages/member/acp/AnnuairePole';

// Routes helpers
import { ProtectedRoute, ProtectedCNAdminRoute } from './routes/ProtectedRoute';
import { MemberIndexRedirect } from './routes/MemberIndexRedirect';

/* Layout public */
function PublicLayoutWrapper() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  );
}

/* Layout membre */
function MemberLayoutWrapper() {
  return <MemberLayout />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>

          {/* ================= ROUTES PUBLIQUES ================= */}
          <Route element={<PublicLayoutWrapper />}>
            <Route path="/" element={<Home />} />
            <Route path="/ora" element={<AboutORA />} />
            <Route path="/apprentis" element={<ApprenticeInfo />} />
            <Route path="/apprentis/inscription" element={<ApprenticeRegistration />} />
            <Route path="/mentors" element={<BecomeMentor />} />
            <Route path="/mentors/inscription" element={<MentorRegistration />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/temoignages" element={<Testimonials />} />
            <Route path="/partenaires" element={<Partners />} />
            <Route path="/implantations" element={<Implantations />} />
            <Route path="/actualites" element={<News />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/test-debug" element={<TestDebug />} />
            <Route path="/evaluer-mentor/:token" element={<EvaluationPage />} />
          </Route>

          {/* ================= ROUTES MEMBRES ================= */}
          <Route element={<ProtectedRoute />}>
            <Route path="/member" element={<MemberLayoutWrapper />}>
              
              {/* Redirection index selon rôle */}
              <Route index element={<MemberIndexRedirect />} />

              {/* MENTOR */}
              <Route element={<ProtectedRoute allowedRoles={['MENTOR']} />}>
                <Route path="mentor/dashboard" element={<MentorDashboard />} />
              </Route>

              {/* AP - Dashboard Association (NOUVELLE VERSION) */}
              <Route element={<ProtectedRoute allowedRoles={['AP', 'ACP', 'CN']} />}>
                <Route path="ap/dashboard" element={<APDashboard />} />
              </Route>

              {/* AP + ACP + CN - Gestion des mentors */}
              <Route element={<ProtectedRoute allowedRoles={['AP', 'ACP', 'CN']} />}>
                <Route path="acp/mentors" element={<GestionMentors />} />
              </Route>

              {/* ACP + CN - Dashboard pôle complet */}
              <Route element={<ProtectedRoute allowedRoles={['ACP', 'CN']} />}>
                <Route path="acp/dashboard"   element={<ACPDashboard />} />
                <Route path="acp/animateurs"  element={<GestionAnimateurs />} />
                <Route path="acp/mentorats"   element={<GestionMentorats />} />
                <Route path="acp/annuaire"    element={<AnnuairePole />} />
                <Route path="pole/dashboard"  element={<PoleDashboard />} />
                <Route path="matching"        element={<MatchingBoard />} />
                <Route path="pole/kpi"        element={<PoleKPIs />} />
              </Route>

              {/* CN - Accès lecture (tous les membres CN) */}
              <Route element={<ProtectedRoute allowedRoles={['CN']} />}>
                <Route path="cn/dashboard"     element={<CNDashboard />} />
                <Route path="cn/annuaire"      element={<AnnuaireORA />} />
                <Route path="cn/implantations" element={<ImplantationsPoles />} />
                <Route path="cn/kpis"          element={<NationalKPIs />} />
              </Route>

              {/* CN - Accès complet (cn_acces_complet uniquement) */}
              <Route element={<ProtectedCNAdminRoute />}>
                <Route path="cn/retribution"   element={<RetributionCN />} />
                <Route path="cn/mentors"       element={<CNMentors />} />
                <Route path="cn/messages"      element={<CNMessages />} />
                <Route path="cn/poles"         element={<CNPoles />} />
                <Route path="cn/animateurs"    element={<GestionAnimateursNational />} />
                <Route path="cn/configuration" element={<CNConfiguration />} />
              </Route>

              {/* Fallback 404 dans /member */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* 404 Global */}
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
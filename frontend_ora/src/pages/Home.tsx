import { Link } from "react-router-dom";
import { ArrowRight, Shield, GraduationCap, Zap, MapPin } from "lucide-react";
import { StatSection } from "../components/StatSection";
import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

interface PublicStats { total_poles: number; total_departments_covered: number; }

export function Home() {
  const [implantStats, setImplantStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    api.get<PublicStats>('/public/stats/')
      .then(r => setImplantStats(r.data))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => [
    { value: 6000, label: "Jeunes accompagnés", suffix: "+" },
    { value: 3000, label: "Mentors bénévoles", suffix: "+" },
    { value: implantStats?.total_departments_covered ?? 45, label: "Départements", suffix: "" },
    { value: implantStats?.total_poles ?? 12, label: "Pôles actifs", suffix: "" },
  ], [implantStats]);

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative text-white py-28 text-center"
        style={{
          background:
            "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.72)), url('/images/image_mentorat.png') center center / cover no-repeat",
        }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Ton Avenir Pro Commence Ici.
          </h1>
          <p className="text-lg md:text-xl text-white/90 leading-relaxed">
            Objectif Réussir l'Apprentissage (ORA) soutient les jeunes de 18 à
            29&nbsp;ans dans tous leurs projets d'alternance. Ne reste pas seul
            face à tes questions.
          </p>
        </div>
      </section>

      {/* ─── TROIS PORTES ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-12 relative z-10">
        <div className="grid md:grid-cols-3 gap-6">

          {/* Trouver mon Alternance — orange */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-ora-orange flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform">
            <div>
              <div className="text-5xl mb-5">🔍</div>
              <h2 className="text-xl font-bold text-ora-orange mb-3">
                Trouver mon Alternance
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Je suis en recherche d'apprentissage (contrat d'entreprise ou
                centre de formation). ORA m'aide à construire mon projet et à
                trouver mes partenaires.
              </p>
            </div>
            <Link
              to="/apprentis/inscription"
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-ora-orange text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              ME FAIRE ACCOMPAGNER
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Je suis Apprenti(e) — rouge corail */}
          <div
            className="bg-white rounded-2xl shadow-lg border-t-4 flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform"
            style={{ borderTopColor: "#ff6b6b" }}
          >
            <div>
              <div className="text-5xl mb-5">🚀</div>
              <h2
                className="text-xl font-bold mb-3"
                style={{ color: "#ff6b6b" }}
              >
                Je suis Apprenti(e)
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tu as déjà ton contrat d'apprentissage&nbsp;? Booste ta réussite
                et évite les obstacles avec un mentor expérimenté. C'est gratuit
                et personnalisé.
              </p>
            </div>
            <Link
              to="/apprentis/inscription"
              className="mt-6 flex items-center justify-center gap-2 w-full py-3 text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
              style={{ backgroundColor: "#ff6b6b" }}
            >
              M'INSCRIRE MAINTENANT
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* CFA, Greta, Mentors... — bleu */}
          <div className="bg-white rounded-2xl shadow-lg border-t-4 border-ora-blue flex flex-col justify-between p-8 hover:-translate-y-1 transition-transform">
            <div>
              <div className="text-5xl mb-5">🤝</div>
              <h2 className="text-xl font-bold text-ora-blue mb-3">
                CFA, Greta, Mentors…
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Vous êtes une institution, une entreprise, ou vous souhaitez
                transmettre votre expérience&nbsp;? Collaborons pour sécuriser
                les parcours professionnels.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/mentors/inscription"
                className="flex items-center justify-center gap-2 w-full py-3 bg-ora-blue text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Devenir Mentor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#333] text-white rounded-full font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Contact Institutionnel
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ─── STATISTIQUES ──────────────────────────────────────── */}
      <StatSection stats={stats} />

      {/* ─── POURQUOI ORA ? ────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-ora-blue mb-14">
            Pourquoi choisir l'accompagnement ORA&nbsp;?
          </h2>
          <div className="grid md:grid-cols-3 gap-10">

            <div className="text-center px-4">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Zéro Décrochage
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Nous agissons comme un bouclier contre les ruptures de contrat
                en offrant une écoute et une médiation rapide entre le jeune et
                l'entreprise.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Réussite Diplômante
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Aide à l'organisation, soutien pédagogique ciblé et préparation
                aux examens pour maximiser les chances d'obtenir le diplôme.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="text-5xl mb-4">💪</div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">
                Confiance Boostée
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Développement des "soft skills" et décode des codes de
                l'entreprise pour une intégration durable et sereine dans le
                monde du travail.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── NOS VALEURS ───────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
              Nos valeurs
            </h2>
            <p className="text-slate-500 text-lg">
              Un accompagnement bienveillant et adapté à chaque situation
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">❤️</div>
              <h3 className="font-bold text-slate-800 mb-2">Bienveillant</h3>
              <p className="text-slate-500 text-sm">
                Un accompagnement dans l'écoute, le respect et sans jugement
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-slate-800 mb-2">Confidentiel</h3>
              <p className="text-slate-500 text-sm">
                Vos échanges restent privés et sécurisés
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold text-slate-800 mb-2">Sur-mesure</h3>
              <p className="text-slate-500 text-sm">
                Un mentor adapté à vos besoins et votre situation
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center">
              <div className="text-4xl mb-3">💶</div>
              <h3 className="font-bold text-slate-800 mb-2">100% Gratuit</h3>
              <p className="text-slate-500 text-sm">
                Un service entièrement gratuit pour tous les jeunes
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── TERRITOIRE ────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-ora-blue to-ora-dark rounded-2xl p-12 text-white">
            <MapPin className="w-14 h-14 mx-auto mb-5 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Présents sur tout le territoire
            </h2>
            <p className="text-white/80 mb-8 text-sm">
              {implantStats
                ? `${implantStats.total_departments_covered} département${implantStats.total_departments_covered > 1 ? 's' : ''} couverts · ${implantStats.total_poles} pôle${implantStats.total_poles > 1 ? 's' : ''} actifs à votre service.`
                : 'Des pôles locaux à votre service partout en France.'}
            </p>
            <Link
              to="/implantations"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-ora-blue rounded-full font-semibold hover:bg-blue-50 transition-colors"
            >
              Voir nos implantations
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { HandHeart, ArrowRight } from 'lucide-react';

export function Supporters() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <HandHeart className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Ils nous soutiennent
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Ces partenaires nous financent et nous permettent de pérenniser ORA au profit des jeunes apprentis
          </p>
        </div>
      </section>

      {/* ── Corps ── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Texte introductif */}
          <div className="prose prose-lg max-w-none mb-14 text-slate-700 space-y-4">
            <p className="text-lg leading-relaxed">
              Notre budget annuel couvre nos frais fixes d'association, nos frais informatiques
              (ce site internet et son intranet), des frais de Formation locale (parfois nationale)
              de nos Mentors et Animateurs de Pôles ainsi que nos frais de Communication (publications).
            </p>
            <p className="text-lg leading-relaxed">
              ORA et son association support TSB n'emploient pas de salarié et s'appuient sur le
              bénévolat de compétence des associations mère. Nos Mentors agissent bénévolement.
            </p>
            <p className="text-lg leading-relaxed">
              Les financements nationaux permettent d'agir localement au plus près des apprentis
              de tous nos pôles à travers la France.
            </p>
            <p className="text-lg leading-relaxed">
              Les financements locaux nous ancrent dans les territoires à proximité des CFA qui nous font confiance.
            </p>
          </div>

          {/* ── Nationalement ── */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px flex-1 bg-slate-200" />
              <h2 className="text-2xl font-bold text-slate-900 whitespace-nowrap">Nationalement</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex flex-wrap justify-center gap-10 items-center">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center w-48 h-32 hover:shadow-md transition-shadow">
                  <img src="/DJEPVA.png" alt="DJEPVA" className="max-h-20 max-w-full object-contain" />
                </div>
                <p className="text-sm text-slate-500 font-medium text-center">DJEPVA</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center w-48 h-32 hover:shadow-md transition-shadow">
                  <img src="/TSB.png" alt="Talents Seniors Bénévoles" className="max-h-20 max-w-full object-contain" />
                </div>
                <p className="text-sm text-slate-500 font-medium text-center">Talents Seniors Bénévoles</p>
              </div>
            </div>
          </div>

          {/* ── Régionalement ── */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px flex-1 bg-slate-200" />
              <h2 className="text-2xl font-bold text-slate-900 whitespace-nowrap">Régionalement</h2>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex flex-wrap justify-center gap-10 items-center">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-center w-48 h-32 hover:shadow-md transition-shadow">
                  <img src="/ase_lyon.png" alt="ASE Métropole de Lyon" className="max-h-20 max-w-full object-contain" />
                </div>
                <p className="text-sm text-slate-500 font-medium text-center">ASE Métropole de Lyon</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA bas de page ── */}
      <section className="py-16 bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Vous aussi souhaiteriez nous soutenir, renseignez-vous ?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Contactez-nous pour en savoir plus sur les modalités de partenariat avec ORA.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ora-blue rounded-lg font-bold hover:bg-slate-100 transition-colors text-lg"
          >
            Nous contacter
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

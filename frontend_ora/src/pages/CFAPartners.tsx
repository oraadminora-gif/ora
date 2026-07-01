import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Building2 } from 'lucide-react';

const cfaList = [
  'BTP CFA Rhône',
  'CFA BTP François Rabelais',
  'CFA SEPR',
  'GRETA Formation',
  'CFA UIMM',
  'IFAIP Interfora',
  'CFA AFPA La Valette',
  'Chambre des Métiers Campus Simone Veil',
  'Club des Entreprises',
  'GRETA Lorraine Centre Grand Est',
  'CFA Bâtiment Allier',
  'CFA Bâtiment Normandie',
  'CFA AFI LNR',
  'MFR CFA',
  'CFA Coiffure Arcole',
  'CFA Sport et Formation',
  'Le Prado',
  'Centre de Formation Excellence Le Havre',
  'IFA Marcel Sauvage Rouen',
  'Association Fil',
  'INBP CFA',
  'École Nationale des Fleuristes',
  'Forma Sup Méditerranée',
];

export function CFAPartners() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <GraduationCap className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Nos CFA Partenaires
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Ces établissements reconnaissent la qualité et l'efficacité de nos mentorats auprès de leurs jeunes apprentis
          </p>
        </div>
      </section>

      {/* ── Corps ── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Intro */}
          <div className="bg-ora-blue/5 border-l-4 border-ora-blue rounded-r-xl p-6 mb-12">
            <p className="text-lg text-slate-700 leading-relaxed">
              Vous souhaitez rejoindre l'aventure ORA ? Vous êtes acteur de l'apprentissage,
              responsable pédagogique ou formateur en CFA ? Nous vous proposons de nous contacter
              pour échanger sur l'apprentissage et un éventuel développement mentorat/mentoré.
            </p>
          </div>

          {/* Grille CFA */}
          <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-ora-blue" />
            Ils nous font confiance
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {cfaList.map((cfa, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:border-ora-blue hover:bg-ora-blue/5 transition-all"
              >
                <div className="w-8 h-8 bg-ora-blue/10 rounded-lg flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-ora-blue" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{cfa}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Vous souhaitez rejoindre nos CFA partenaires ?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Contactez-nous pour échanger sur l'apprentissage et un éventuel partenariat mentorat avec votre établissement.
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

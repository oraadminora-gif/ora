import { Link } from 'react-router-dom';
import { Building, Users, Heart } from 'lucide-react';

const partners = [
  {
    name: 'Collectif Mentorat',
    type: 'institutional',
    description: 'ORA est membre du Collectif Mentorat, qui fédère les acteurs du mentorat en France pour favoriser l\'accès au mentorat pour tous les jeunes.'
  },
  {
    name: 'Talents Seniors Bénévoles',
    type: 'organizational',
    description: 'ORA est coordonné par Talents Seniors Bénévoles, qui réunit quatre associations nationales : AGIRabcd, ECTI, EGEE et OTECI.'
  },
  {
    name: '1 jeune, 1 mentor',
    type: 'governmental',
    description: 'ORA s\'inscrit dans le dispositif gouvernemental "1 jeune, 1 mentor" qui vise à accompagner 100 000 jeunes vers la réussite.'
  }
];

const associations = [
  {
    name: 'AGIRabcd',
    description: 'Association Générale des Intervenants Retraités'
  },
  {
    name: 'ECTI',
    description: 'Entreprises, Collectivités Territoriales et Initiatives'
  },
  {
    name: 'EGEE',
    description: 'Entente des Générations pour l\'Emploi et l\'Entreprise'
  },
  {
    name: 'OTECI',
    description: 'Organisation Technique Européenne pour la Coopération Internationale'
  }
];

export function Partners() {
  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Building className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Notre réseau associatif
            </h1>
          </div>
          <p className="text-xl text-white/90">
            ORA s'apppuie sur un réseau  d'acteurs engagés pour la réussite des jeunes
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {partners.map((partner, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200 hover:border-ora-blue hover:shadow-lg transition-all">
                <div className="w-14 h-14 bg-ora-blue/20 rounded-xl flex items-center justify-center mb-4">
                  <Building className="w-8 h-8 text-ora-blue" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{partner.name}</h3>
                <p className="text-slate-700 leading-relaxed">{partner.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-ora-blue/10 rounded-2xl p-8 mb-16 border-2 border-ora-blue/20">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-8 h-8 text-ora-blue" />
              <h2 className="text-2xl font-bold text-slate-900">
                Talents Seniors Bénévoles
              </h2>
            </div>
            <p className="text-lg text-slate-700 mb-6">
              ORA est coordonné par <strong>Talents Seniors Bénévoles</strong>, une structure qui fédère quatre grandes associations nationales de seniors bénévoles engagés dans la transmission et l'accompagnement.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {associations.map((assoc, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border-2 border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">{assoc.name}</h4>
                  <p className="text-sm text-slate-600">{assoc.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-ora-blue to-ora-dark rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8" />
              <h2 className="text-2xl font-bold">
                Devenir partenaire d'ORA
              </h2>
            </div>
            <p className="text-lg text-white/90 mb-6">
              Vous êtes un CFA, une institution, une collectivité ou une association et vous souhaitez nous soutenir dans notre mission ? Contactez-nous pour échanger sur des partenariats possibles.
            </p>
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-white text-ora-blue rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

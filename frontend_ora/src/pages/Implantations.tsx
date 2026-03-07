import { MapPin, Mail } from 'lucide-react';
import { useState } from 'react';

const implantations = [
  { department: 'Ain', code: '01', city: 'Bourg-en-Bresse', email: 'contact.ain@ora-france.fr' },
  { department: 'Bouches-du-Rhône', code: '13', city: 'Marseille', email: 'contact.marseille@ora-france.fr' },
  { department: 'Gironde', code: '33', city: 'Bordeaux', email: 'contact.bordeaux@ora-france.fr' },
  { department: 'Hérault', code: '34', city: 'Montpellier', email: 'contact.montpellier@ora-france.fr' },
  { department: 'Isère', code: '38', city: 'Grenoble', email: 'contact.grenoble@ora-france.fr' },
  { department: 'Loire', code: '42', city: 'Saint-Étienne', email: 'contact.loire@ora-france.fr' },
  { department: 'Loire-Atlantique', code: '44', city: 'Nantes', email: 'contact.nantes@ora-france.fr' },
  { department: 'Rhône', code: '69', city: 'Lyon', email: 'contact.lyon@ora-france.fr' },
  { department: 'Paris', code: '75', city: 'Paris', email: 'contact.paris@ora-france.fr' },
  { department: 'Haute-Garonne', code: '31', city: 'Toulouse', email: 'contact.toulouse@ora-france.fr' },
  { department: 'Nord', code: '59', city: 'Lille', email: 'contact.lille@ora-france.fr' },
  { department: 'Bas-Rhin', code: '67', city: 'Strasbourg', email: 'contact.strasbourg@ora-france.fr' },
];

export function Implantations() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredImplantations = implantations.filter(imp =>
    imp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imp.code.includes(searchTerm) ||
    imp.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Nos implantations
            </h1>
          </div>
          <p className="text-xl text-white/90">
            ORA est présent dans plus de 50 départements partout en France
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rechercher par département, code postal ou ville
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Rhône, 69, Lyon..."
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-ora-blue focus:border-transparent text-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredImplantations.map((impl, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-100 hover:border-ora-blue hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-ora-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-ora-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-ora-blue bg-ora-blue/20 px-2 py-1 rounded">
                        {impl.code}
                      </span>
                      <h3 className="font-bold text-slate-900">{impl.department}</h3>
                    </div>
                    <p className="text-slate-600">{impl.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-ora-blue" />
                  <a href={`mailto:${impl.email}`} className="hover:text-ora-blue transition-colors break-all">
                    {impl.email}
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredImplantations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-600">Aucune implantation trouvée pour votre recherche</p>
            </div>
          )}

          <div className="bg-ora-blue rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Ton département n'est pas listé ?
            </h2>
            <p className="text-lg text-white/90 mb-6">
              ORA continue de se développer sur tout le territoire. Si ton département n'apparaît pas encore, contacte-nous ! Nous étudierons la possibilité d'ouvrir un centre près de chez toi.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-white text-ora-blue rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

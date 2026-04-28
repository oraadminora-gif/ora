import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Quote, Filter } from 'lucide-react';

interface Testimonial {
  id: number;
  type: 'mentee' | 'mentor' | 'parent';
  name: string;
  age?: number;
  city: string;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    type: 'mentee',
    name: 'Léa',
    age: 19,
    city: 'Lyon',
    content: "Grâce à mon mentor ORA, j'ai repris confiance en moi. J'avais des difficultés avec mon maître d'apprentissage et je pensais tout arrêter. Mon mentor m'a écoutée, m'a donné des conseils pour mieux communiquer et j'ai pu aller jusqu'au bout de mon CAP pâtisserie !"
  },
  {
    id: 2,
    type: 'mentor',
    name: 'Michel',
    age: 68,
    city: 'Paris',
    content: "Devenir mentor ORA a donné un nouveau sens à ma retraite. Accompagner ces jeunes, leur transmettre mon expérience du monde de l'entreprise, les voir grandir et réussir... c'est une expérience incroyablement enrichissante !"
  },
  {
    id: 3,
    type: 'mentee',
    name: 'Karim',
    age: 21,
    city: 'Marseille',
    content: "Mon mentor m'a aidé à m'organiser et à gérer mon temps entre le CFA et l'entreprise. Avant, j'étais tout le temps débordé. Maintenant, j'ai trouvé mon rythme et mes notes ont beaucoup progressé !"
  },
  {
    id: 4,
    type: 'parent',
    name: 'Sophie, maman de Lucas',
    city: 'Toulouse',
    content: "Mon fils était perdu et démotivé dans son apprentissage. Son mentor ORA a su le remotiver et l'aider à voir les choses autrement. Je suis reconnaissante pour cet accompagnement qui a sauvé son parcours."
  },
  {
    id: 5,
    type: 'mentee',
    name: 'Amélie',
    age: 18,
    city: 'Nantes',
    content: "Je voulais changer d'entreprise mais je ne savais pas comment faire. Mon mentor m'a accompagnée dans mes démarches, m'a aidée à préparer mes entretiens. Aujourd'hui, je suis dans une super entreprise et je m'épanouis enfin !"
  },
  {
    id: 6,
    type: 'mentor',
    name: 'Françoise',
    age: 65,
    city: 'Bordeaux',
    content: "Ce qui me touche le plus, c'est la confiance que les jeunes nous accordent. Ils se livrent, partagent leurs doutes, leurs peurs. Les accompagner vers la réussite, c'est vraiment gratifiant. Je recommande à tous les seniors de devenir mentors !"
  },
  {
    id: 7,
    type: 'mentee',
    name: 'Thomas',
    age: 20,
    city: 'Lille',
    content: "J'hésitais entre continuer mon apprentissage ou arrêter. Mon mentor m'a aidé à y voir plus clair sur mes objectifs professionnels. Aujourd'hui, j'ai validé mon BTS et je suis en poste dans l'entreprise où j'étais apprenti !"
  },
  {
    id: 8,
    type: 'mentee',
    name: 'Sarah',
    age: 22,
    city: 'Strasbourg',
    content: "Avec ORA, j'ai trouvé quelqu'un qui m'écoute vraiment, sans me juger. Mon mentor comprend mes difficultés et me donne des conseils concrets. C'est un vrai soutien dans mon parcours."
  }
];

type FilterOption = 'all' | 'mentee' | 'mentor' | 'parent';

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'Tous les témoignages' },
  { value: 'mentee', label: 'Apprentis' },
  { value: 'mentor', label: 'Mentors' },
  { value: 'parent', label: 'Parents' }
];

export function Testimonials() {
  const [filter, setFilter] = useState<FilterOption>('all');

  const filteredTestimonials = filter === 'all'
    ? testimonials
    : testimonials.filter(t => t.type === filter);

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'mentee': return 'Apprenti(e)';
      case 'mentor': return 'Mentor';
      case 'parent': return 'Parent';
      default: return '';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'mentee': return 'bg-ora-blue/20 text-ora-blue';
      case 'mentor': return 'bg-green-100 text-green-700';
      case 'parent': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Quote className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Témoignages
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Ils ont été accompagnés ou sont devenus mentors ORA. Découvrez leurs histoires.
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Filter className="w-5 h-5 text-slate-600" />
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === option.value
                      ? 'bg-ora-blue text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-2 border-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {filteredTestimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-100 hover:border-ora-blue hover:shadow-md transition-all">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-ora-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Quote className="w-6 h-6 text-ora-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-slate-900">{testimonial.name}</h3>
                      {testimonial.age && (
                        <span className="text-sm text-slate-600">• {testimonial.age} ans</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(testimonial.type)}`}>
                        {getTypeLabel(testimonial.type)}
                      </span>
                      <span className="text-sm text-slate-600">{testimonial.city}</span>
                    </div>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-ora-blue rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Toi aussi, rejoins ORA !
            </h3>
            <p className="text-lg text-white/90 mb-6">
              Que tu sois apprenti(e) ou senior, viens vivre une expérience enrichissante avec ORA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/apprentis/inscription"
                className="inline-block px-6 py-3 bg-white text-ora-blue rounded-lg font-semibold hover:bg-slate-100 transition-colors"
              >
                Je suis apprenti(e)
              </Link>
              <Link
                to="/mentors/inscription"
                className="inline-block px-6 py-3 bg-ora-dark text-white border-2 border-white rounded-lg font-semibold hover:bg-ora-blue transition-colors"
              >
                Je veux devenir mentor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

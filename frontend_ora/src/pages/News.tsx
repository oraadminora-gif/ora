import { Newspaper, Calendar, ArrowRight } from 'lucide-react';

const articles = [
  {
    id: 1,
    title: 'ORA franchit le cap des 600 jeunes accompagnés',
    category: 'ORA',
    date: '2025-01-15',
    summary: 'Un cap symbolique franchi ! ORA a accompagné plus de 600 jeunes apprentis depuis sa création, avec un taux de réussite en constante progression.',
    image: null
  },
  {
    id: 2,
    title: 'Nouveau partenariat avec la Région pour développer le mentorat',
    category: 'Partenaires',
    date: '2025-01-10',
    summary: 'ORA signe une convention avec la Région pour étendre son action auprès des apprentis et renforcer le maillage territorial.',
    image: null
  },
  {
    id: 3,
    title: 'Témoignage : "Mon mentor m\'a redonné confiance"',
    category: 'Témoignages',
    date: '2024-12-20',
    summary: 'Sarah, 19 ans, apprentie en coiffure, raconte comment son mentor ORA l\'a aidée à surmonter ses difficultés et à valider son CAP.',
    image: null
  },
  {
    id: 4,
    title: 'Formation des nouveaux mentors : une journée enrichissante',
    category: 'ORA',
    date: '2024-12-15',
    summary: '25 nouveaux mentors bénévoles ont participé à la formation ORA pour acquérir les clés d\'un accompagnement réussi.',
    image: null
  },
  {
    id: 5,
    title: 'L\'apprentissage en France : les chiffres 2024',
    category: 'Apprentissage',
    date: '2024-12-01',
    summary: 'Décryptage des derniers chiffres de l\'apprentissage en France : hausse des contrats, taux d\'insertion professionnelle et défis à relever.',
    image: null
  },
  {
    id: 6,
    title: 'Le Collectif Mentorat lance une campagne nationale',
    category: 'Mentorat',
    date: '2024-11-25',
    summary: 'Le Collectif Mentorat, dont ORA est membre, lance une grande campagne pour sensibiliser au mentorat et recruter 10 000 nouveaux mentors.',
    image: null
  }
];

const categories = ['Tous', 'ORA', 'Partenaires', 'Témoignages', 'Apprentissage', 'Mentorat'];

export function News() {
  return (
    <div>
      <section className="bg-gradient-to-br from-ora-blue via-ora-dark to-ora-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <Newspaper className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Actualités
            </h1>
          </div>
          <p className="text-xl text-white/90">
            Suivez l'actualité d'ORA, du mentorat et de l'apprentissage
          </p>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                className="px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-medium hover:border-ora-blue hover:text-ora-blue transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <article key={article.id} className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-slate-100 hover:border-ora-blue hover:shadow-md transition-all group">
                <div className="h-48 bg-gradient-to-br from-ora-blue/20 to-ora-dark/20 flex items-center justify-center">
                  <Newspaper className="w-16 h-16 text-ora-blue/40" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-ora-blue/20 text-ora-blue text-xs font-semibold rounded">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <time>{new Date(article.date).toLocaleDateString('fr-FR')}</time>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-ora-blue transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-slate-600 mb-4 line-clamp-3">
                    {article.summary}
                  </p>
                  <button className="text-ora-blue font-semibold flex items-center gap-2 hover:gap-3 transition-all">
                    Lire la suite
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-semibold hover:border-ora-blue hover:text-ora-blue transition-colors">
              Charger plus d'articles
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

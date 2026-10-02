import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Endpoints publics (/public/...) : jamais de jeton, même si un token
    // expiré/invalide traîne encore dans le localStorage d'une session
    // précédente — sinon l'API rejette la requête avec une erreur
    // d'authentification avant même d'évaluer les permissions publiques.
    const isPublic = config.url?.replace(/^\//, '').startsWith('public/');
    if (!isPublic) {
      const token = localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export default api;

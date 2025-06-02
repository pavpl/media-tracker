export const TMDB_CONFIG = {
  apiKey: process.env.REACT_APP_TMDB_API_KEY,
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p',
  language: 'ru-RU'
};

export const TMDB_ENDPOINTS = {
  search: '/search/multi',
  movie: '/movie',
  tv: '/tv',
  person: '/person'
}; 
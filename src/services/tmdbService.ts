import { TMDB_CONFIG, TMDB_ENDPOINTS } from '../config/tmdb';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  media_type: 'movie';
}

export interface TMDBTV {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  first_air_date: string;
  vote_average: number;
  media_type: 'tv';
}

export type TMDBMedia = TMDBMovie | TMDBTV;

export interface TMDBResponse {
  results: TMDBMedia[];
  total_results: number;
  total_pages: number;
}

class TMDBService {
  private async fetchTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const queryParams = new URLSearchParams();
    queryParams.append('api_key', TMDB_CONFIG.apiKey || '');
    queryParams.append('language', TMDB_CONFIG.language);
    
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    const response = await fetch(
      `${TMDB_CONFIG.baseUrl}${endpoint}?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  async searchMedia(query: string): Promise<TMDBResponse> {
    return this.fetchTMDB<TMDBResponse>(TMDB_ENDPOINTS.search, { query });
  }

  async getMovieDetails(id: number): Promise<TMDBMovie> {
    return this.fetchTMDB<TMDBMovie>(`${TMDB_ENDPOINTS.movie}/${id}`);
  }

  async getTVDetails(id: number): Promise<TMDBTV> {
    return this.fetchTMDB<TMDBTV>(`${TMDB_ENDPOINTS.tv}/${id}`);
  }

  getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!path) return '';
    return `${TMDB_CONFIG.imageBaseUrl}/${size}${path}`;
  }
}

export const tmdbService = new TMDBService(); 
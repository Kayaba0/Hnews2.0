const API_BASE = '/api';

export interface Anime {
  id: string;
  title: string;
  releaseDate: string;
  studio: string;
  genre: string[];
  description: string;
  coverImage: string;
  gallery: string[];
  episodes?: number | null;
  createdAt?: Date;
}

export interface AnimeEpisode {
  id: string;
  animeId: string;
  title: string;
  episodeNumber: number;
  releaseDate: string;
  coverImage: string;
  description?: string | null;
  gallery?: string[] | null;
  trailerUrl?: string | null;
  genre?: string[] | null;
  createdAt?: Date;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Studio {
  id: string;
  name: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export const api = {
  // Animes
  async getAnimes(): Promise<Anime[]> {
    const response = await fetch(`${API_BASE}/animes`, { credentials: 'include' });
    return handleResponse<Anime[]>(response);
  },
  
  async getAnime(id: string): Promise<Anime> {
    const response = await fetch(`${API_BASE}/animes/${id}`, { credentials: 'include' });
    return handleResponse<Anime>(response);
  },
  
  async createAnime(anime: Omit<Anime, 'id' | 'createdAt'>): Promise<Anime> {
    const response = await fetch(`${API_BASE}/animes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anime),
      credentials: 'include',
    });
    return handleResponse<Anime>(response);
  },
  
  async updateAnime(id: string, anime: Partial<Anime>): Promise<Anime> {
    const response = await fetch(`${API_BASE}/animes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(anime),
      credentials: 'include',
    });
    return handleResponse<Anime>(response);
  },
  
  async deleteAnime(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/animes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<void>(response);
  },

  // Episodes
  async getEpisodes(): Promise<AnimeEpisode[]> {
    const response = await fetch(`${API_BASE}/episodes`, { credentials: 'include' });
    return handleResponse<AnimeEpisode[]>(response);
  },
  
  async getEpisode(id: string): Promise<AnimeEpisode> {
    const response = await fetch(`${API_BASE}/episodes/${id}`, { credentials: 'include' });
    return handleResponse<AnimeEpisode>(response);
  },
  
  async createEpisode(episode: Omit<AnimeEpisode, 'id' | 'createdAt'>): Promise<AnimeEpisode> {
    const response = await fetch(`${API_BASE}/episodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(episode),
      credentials: 'include',
    });
    return handleResponse<AnimeEpisode>(response);
  },
  
  async updateEpisode(id: string, episode: Partial<AnimeEpisode>): Promise<AnimeEpisode> {
    const response = await fetch(`${API_BASE}/episodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(episode),
      credentials: 'include',
    });
    return handleResponse<AnimeEpisode>(response);
  },
  
  async deleteEpisode(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/episodes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<void>(response);
  },

  // Genres
  async getGenres(): Promise<Genre[]> {
    const response = await fetch(`${API_BASE}/genres`, { credentials: 'include' });
    return handleResponse<Genre[]>(response);
  },
  
  async createGenre(name: string): Promise<Genre> {
    const response = await fetch(`${API_BASE}/genres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });
    return handleResponse<Genre>(response);
  },
  
  async updateGenre(id: string, name: string): Promise<Genre> {
    const response = await fetch(`${API_BASE}/genres/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });
    return handleResponse<Genre>(response);
  },
  
  async deleteGenre(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/genres/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<void>(response);
  },

  // Studios
  async getStudios(): Promise<Studio[]> {
    const response = await fetch(`${API_BASE}/studios`, { credentials: 'include' });
    return handleResponse<Studio[]>(response);
  },
  
  async createStudio(name: string): Promise<Studio> {
    const response = await fetch(`${API_BASE}/studios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });
    return handleResponse<Studio>(response);
  },
  
  async updateStudio(id: string, name: string): Promise<Studio> {
    const response = await fetch(`${API_BASE}/studios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });
    return handleResponse<Studio>(response);
  },
  
  async deleteStudio(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/studios/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<void>(response);
  },
};

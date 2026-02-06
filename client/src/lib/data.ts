import { create } from 'zustand';
import { api, Anime, AnimeEpisode, Genre, Studio } from './api';

export type { Anime, AnimeEpisode, Genre, Studio };

interface AppState {
  animes: Anime[];
  upcomingEpisodes: AnimeEpisode[];
  availableGenres: Genre[];
  availableStudios: Studio[];
  isAdmin: boolean;
  language: 'it' | 'en';
  theme: 'dark' | 'light';
  isLoading: boolean;
  
  selectedAnime: Anime | null;

  setSelectedAnime: (anime: Anime | null) => void;
  // Actions
  login: () => void;
  logout: () => void;
  setLanguage: (lang: 'it' | 'en') => void;
  
  // Data fetching
  fetchAllData: () => Promise<void>;
  
  // Anime actions
  addAnime: (anime: Omit<Anime, 'id' | 'createdAt'>) => Promise<void>;
  updateAnime: (id: string, anime: Partial<Anime>) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
  
  // Episode actions
  addUpcomingEpisode: (episode: Omit<AnimeEpisode, 'id' | 'createdAt'>) => Promise<void>;
  updateUpcomingEpisode: (id: string, episode: Partial<AnimeEpisode>) => Promise<void>;
  deleteUpcomingEpisode: (id: string) => Promise<void>;
  
  // Genre actions
  addGenre: (name: string) => Promise<void>;
  updateGenre: (id: string, newName: string) => Promise<void>;
  deleteGenre: (id: string) => Promise<void>;
  
  // Studio actions
  addStudio: (name: string) => Promise<void>;
  updateStudio: (id: string, newName: string) => Promise<void>;
  deleteStudio: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  animes: [],
  upcomingEpisodes: [],
  availableGenres: [],
  availableStudios: [],
  isAdmin: localStorage.getItem('isAdmin') === 'true',
  language: 'it',
  theme: 'dark',
  isLoading: true,
  
  selectedAnime: null,
  login: () => {
  localStorage.setItem('isAdmin', 'true');
  set({ isAdmin: true });
},
  logout: () => {
  localStorage.removeItem('isAdmin');
  set({ isAdmin: false });
},
  setLanguage: (lang) => set({ language: lang }),
  
  setSelectedAnime: (anime) => set({ selectedAnime: anime }),
  fetchAllData: async () => {
    set({ isLoading: true });
    try {
      const [animes, episodes, genres, studios] = await Promise.all([
        api.getAnimes(),
        api.getEpisodes(),
        api.getGenres(),
        api.getStudios(),
      ]);
      set({ 
        animes, 
        upcomingEpisodes: episodes, 
        availableGenres: genres,
        availableStudios: studios,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      set({ isLoading: false });
    }
  },
  
  // Anime actions
  addAnime: async (anime) => {
    try {
      const created = await api.createAnime(anime);
      set((state) => ({ animes: [...state.animes, created] }));
    } catch (error) {
      console.error('Failed to create anime:', error);
      throw error;
    }
  },
  
  updateAnime: async (id, updates) => {
    try {
      const updated = await api.updateAnime(id, updates);
      set((state) => ({
        animes: state.animes.map((a) => (a.id === id ? updated : a)),
      }));
    } catch (error) {
      console.error('Failed to update anime:', error);
      throw error;
    }
  },
  
  deleteAnime: async (id) => {
    try {
      await api.deleteAnime(id);
      set((state) => ({ animes: state.animes.filter((a) => a.id !== id) }));
    } catch (error) {
      console.error('Failed to delete anime:', error);
      throw error;
    }
  },
  
  // Episode actions
  addUpcomingEpisode: async (episode) => {
    try {
      const created = await api.createEpisode(episode);
      set((state) => ({ 
        upcomingEpisodes: [...state.upcomingEpisodes, created],
        animes: state.animes.map(a => 
          a.id === episode.animeId 
            ? { ...a, episodes: (a.episodes || 0) + 1 } 
            : a
        )
      }));
    } catch (error) {
      console.error('Failed to create episode:', error);
      throw error;
    }
  },
  
  updateUpcomingEpisode: async (id, updates) => {
    try {
      const updated = await api.updateEpisode(id, updates);
      set((state) => ({
        upcomingEpisodes: state.upcomingEpisodes.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (error) {
      console.error('Failed to update episode:', error);
      throw error;
    }
  },
  
  deleteUpcomingEpisode: async (id) => {
    try {
      await api.deleteEpisode(id);
      set((state) => ({ 
        upcomingEpisodes: state.upcomingEpisodes.filter((e) => e.id !== id) 
      }));
    } catch (error) {
      console.error('Failed to delete episode:', error);
      throw error;
    }
  },
  
  // Genre actions
  addGenre: async (name) => {
    try {
      const created = await api.createGenre(name);
      set((state) => ({ 
        availableGenres: [...state.availableGenres, created].sort((a, b) => a.name.localeCompare(b.name))
      }));
    } catch (error) {
      console.error('Failed to create genre:', error);
      throw error;
    }
  },
  
  updateGenre: async (id, newName) => {
    try {
      const updated = await api.updateGenre(id, newName);
      set((state) => ({
        availableGenres: state.availableGenres.map(g => g.id === id ? updated : g).sort((a, b) => a.name.localeCompare(b.name)),
      }));
    } catch (error) {
      console.error('Failed to update genre:', error);
      throw error;
    }
  },
  
  deleteGenre: async (id) => {
    try {
      await api.deleteGenre(id);
      set((state) => ({
        availableGenres: state.availableGenres.filter(g => g.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete genre:', error);
      throw error;
    }
  },
  
  // Studio actions
  addStudio: async (name) => {
    try {
      const created = await api.createStudio(name);
      set((state) => ({ 
        availableStudios: [...state.availableStudios, created].sort((a, b) => a.name.localeCompare(b.name))
      }));
    } catch (error) {
      console.error('Failed to create studio:', error);
      throw error;
    }
  },
  
  updateStudio: async (id, newName) => {
    try {
      const updated = await api.updateStudio(id, newName);
      set((state) => ({
        availableStudios: state.availableStudios.map(s => s.id === id ? updated : s).sort((a, b) => a.name.localeCompare(b.name)),
      }));
    } catch (error) {
      console.error('Failed to update studio:', error);
      throw error;
    }
  },
  
  deleteStudio: async (id) => {
    try {
      await api.deleteStudio(id);
      set((state) => ({
        availableStudios: state.availableStudios.filter(s => s.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete studio:', error);
      throw error;
    }
  },
}));

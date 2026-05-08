// Custom types for Cineverse database entities

export type AppRole = 'admin' | 'premium' | 'free_user';
export type ContentType = 'movie' | 'series';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  director: string | null;
  actors: string[];
  year: number | null;
  category: string[];
  resolution: string | null;
  file_size: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  stream_url: string | null;
  telegram_url: string | null;
  mega_url: string | null;
  download_url: string | null;
  mx_player_url: string | null;
  is_premium: boolean;
  is_featured: boolean;
  content_type: ContentType;
  average_rating: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface MovieInsert {
  title: string;
  description?: string | null;
  director?: string | null;
  actors?: string[];
  year?: number | null;
  category?: string[];
  resolution?: string | null;
  file_size?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  stream_url?: string | null;
  telegram_url?: string | null;
  mega_url?: string | null;
  download_url?: string | null;
  mx_player_url?: string | null;
  is_premium?: boolean;
  is_featured?: boolean;
  content_type?: ContentType;
}

export interface MovieUpdate extends Partial<MovieInsert> {}

// Season types
export interface Season {
  id: string;
  movie_id: string;
  season_number: number;
  title: string | null;
  created_at: string;
}

export interface SeasonInsert {
  movie_id: string;
  season_number: number;
  title?: string | null;
}

export interface SeasonUpdate extends Partial<Omit<SeasonInsert, 'movie_id'>> {}

// Episode types
export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  description: string | null;
  duration: string | null;
  air_date: string | null;
  thumbnail_url: string | null;
  stream_url: string | null;
  mx_player_url: string | null;
  telegram_url: string | null;
  mega_url: string | null;
  download_url: string | null;
  created_at: string;
}

export interface EpisodeInsert {
  season_id: string;
  episode_number: number;
  title: string;
  description?: string | null;
  duration?: string | null;
  air_date?: string | null;
  thumbnail_url?: string | null;
  stream_url?: string | null;
  mx_player_url?: string | null;
  telegram_url?: string | null;
  mega_url?: string | null;
  download_url?: string | null;
}

export interface EpisodeUpdate extends Partial<Omit<EpisodeInsert, 'season_id'>> {}

// Cast types
export interface CastMember {
  id: string;
  name: string;
  photo_url: string | null;
  created_at: string;
}

export interface MovieCastEntry {
  id: string;
  movie_id: string;
  cast_member_id: string;
  character_name: string | null;
  display_order: number;
  created_at: string;
  cast_member?: CastMember;
}

// Extended types with relations
export interface SeasonWithEpisodes extends Season {
  episodes: Episode[];
}

export interface MovieWithSeasons extends Movie {
  seasons: SeasonWithEpisodes[];
}

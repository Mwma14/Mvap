export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      broken_channels: {
        Row: {
          channel_name: string | null
          channel_url: string
          created_at: string
          id: string
          reported_by: string | null
        }
        Insert: {
          channel_name?: string | null
          channel_url: string
          created_at?: string
          id?: string
          reported_by?: string | null
        }
        Update: {
          channel_name?: string | null
          channel_url?: string
          created_at?: string
          id?: string
          reported_by?: string | null
        }
        Relationships: []
      }
      cast_members: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      episodes: {
        Row: {
          air_date: string | null
          created_at: string
          description: string | null
          download_url: string | null
          duration: string | null
          episode_number: number
          id: string
          mega_url: string | null
          mx_player_url: string | null
          season_id: string
          stream_url: string | null
          telegram_url: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          air_date?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          duration?: string | null
          episode_number: number
          id?: string
          mega_url?: string | null
          mx_player_url?: string | null
          season_id: string
          stream_url?: string | null
          telegram_url?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          air_date?: string | null
          created_at?: string
          description?: string | null
          download_url?: string | null
          duration?: string | null
          episode_number?: number
          id?: string
          mega_url?: string | null
          mx_player_url?: string | null
          season_id?: string
          stream_url?: string | null
          telegram_url?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_channels: {
        Row: {
          channel_group: string | null
          channel_logo: string | null
          channel_name: string
          channel_url: string
          created_at: string
          id: string
          source_category: string | null
          user_id: string
        }
        Insert: {
          channel_group?: string | null
          channel_logo?: string | null
          channel_name: string
          channel_url: string
          created_at?: string
          id?: string
          source_category?: string | null
          user_id: string
        }
        Update: {
          channel_group?: string | null
          channel_logo?: string | null
          channel_name?: string
          channel_url?: string
          created_at?: string
          id?: string
          source_category?: string | null
          user_id?: string
        }
        Relationships: []
      }
      football_videos: {
        Row: {
          category: string
          created_at: string
          download_url: string | null
          id: string
          is_live: boolean | null
          is_premium: boolean | null
          show_in_highlights: boolean
          show_in_replay: boolean
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          download_url?: string | null
          id?: string
          is_live?: boolean | null
          is_premium?: boolean | null
          show_in_highlights?: boolean
          show_in_replay?: boolean
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          download_url?: string | null
          id?: string
          is_live?: boolean | null
          is_premium?: boolean | null
          show_in_highlights?: boolean
          show_in_replay?: boolean
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      info_slides: {
        Row: {
          accent_color: string
          bg_color: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          redirect_link: string
          title: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          bg_color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          redirect_link?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          bg_color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          redirect_link?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      movie_cast: {
        Row: {
          cast_member_id: string
          character_name: string | null
          created_at: string
          display_order: number | null
          id: string
          movie_id: string
        }
        Insert: {
          cast_member_id: string
          character_name?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          movie_id: string
        }
        Update: {
          cast_member_id?: string
          character_name?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          movie_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_cast_cast_member_id_fkey"
            columns: ["cast_member_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_cast_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_requests: {
        Row: {
          admin_note: string | null
          content_type: string
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          content_type?: string
          created_at?: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          content_type?: string
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      movie_views: {
        Row: {
          created_at: string
          id: string
          last_viewed_at: string | null
          movie_id: string
          view_count: number | null
          weekly_views: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          movie_id: string
          view_count?: number | null
          weekly_views?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          movie_id?: string
          view_count?: number | null
          weekly_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_views_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: true
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          actors: string[] | null
          average_rating: number | null
          backdrop_url: string | null
          category: string[] | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          created_at: string
          description: string | null
          director: string | null
          download_url: string | null
          file_size: string | null
          id: string
          is_featured: boolean | null
          is_premium: boolean | null
          mega_url: string | null
          mx_player_url: string | null
          poster_url: string | null
          rating_count: number | null
          resolution: string | null
          stream_url: string | null
          telegram_url: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          actors?: string[] | null
          average_rating?: number | null
          backdrop_url?: string | null
          category?: string[] | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          director?: string | null
          download_url?: string | null
          file_size?: string | null
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          mega_url?: string | null
          mx_player_url?: string | null
          poster_url?: string | null
          rating_count?: number | null
          resolution?: string | null
          stream_url?: string | null
          telegram_url?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          actors?: string[] | null
          average_rating?: number | null
          backdrop_url?: string | null
          category?: string[] | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          created_at?: string
          description?: string | null
          director?: string | null
          download_url?: string | null
          file_size?: string | null
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          mega_url?: string | null
          mx_player_url?: string | null
          poster_url?: string | null
          rating_count?: number | null
          resolution?: string | null
          stream_url?: string | null
          telegram_url?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          display_order: number
          gradient: string
          id: string
          is_active: boolean
          name: string
          text_color: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          created_at?: string
          display_order?: number
          gradient?: string
          id?: string
          is_active?: boolean
          name: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          display_order?: number
          gradient?: string
          id?: string
          is_active?: boolean
          name?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          payment_method: string | null
          plan_duration: string
          plan_id: string | null
          plan_price: string
          premium_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          plan_duration: string
          plan_id?: string | null
          plan_price: string
          premium_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          payment_method?: string | null
          plan_duration?: string
          plan_id?: string | null
          plan_price?: string
          premium_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string
          display_order: number
          duration: string
          duration_days: number
          id: string
          is_active: boolean
          platinum_price: string | null
          price: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration: string
          duration_days?: number
          id?: string
          is_active?: boolean
          platinum_price?: string | null
          price: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          duration?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          platinum_price?: string | null
          price?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          season_number: number
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          season_number: number
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          season_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      telegram_files: {
        Row: {
          channel_id: string | null
          created_at: string
          file_id: string
          file_name: string | null
          file_size: number | null
          file_unique_id: string
          id: string
          message_id: number | null
          mime_type: string | null
          movie_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          file_id: string
          file_name?: string | null
          file_size?: number | null
          file_unique_id: string
          id?: string
          message_id?: number | null
          mime_type?: string | null
          movie_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          file_id?: string
          file_name?: string | null
          file_size?: number | null
          file_unique_id?: string
          id?: string
          message_id?: number | null
          mime_type?: string | null
          movie_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_files_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      tv_channels: {
        Row: {
          category: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          stream_url: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          stream_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          id: string
          last_active_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name?: string
          id?: string
          last_active_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string
          id?: string
          last_active_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          max_devices: number
          premium_expires_at: string | null
          premium_type: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_devices?: number
          premium_expires_at?: string | null
          premium_type?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_devices?: number
          premium_expires_at?: string | null
          premium_type?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          created_at: string
          duration: number | null
          episode_id: string | null
          id: string
          last_watched_at: string
          movie_id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          episode_id?: string | null
          id?: string
          last_watched_at?: string
          movie_id: string
          progress?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          episode_id?: string | null
          id?: string
          last_watched_at?: string
          movie_id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_history_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          movie_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_premium_request: {
        Args: { _admin_id: string; _request_id: string }
        Returns: undefined
      }
      deny_premium_request: {
        Args: { _admin_id: string; _reason?: string; _request_id: string }
        Returns: undefined
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view_count: { Args: { _movie_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "premium" | "free_user"
      content_type: "movie" | "series"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "premium", "free_user"],
      content_type: ["movie", "series"],
    },
  },
} as const

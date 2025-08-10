export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          ai_model_used: string | null
          created_at: string
          feature_used: string
          id: string
          input_context: Json | null
          project_id: string
          prompt_text: string | null
          response_data: Json | null
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          created_at?: string
          feature_used: string
          id?: string
          input_context?: Json | null
          project_id: string
          prompt_text?: string | null
          response_data?: Json | null
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          created_at?: string
          feature_used?: string
          id?: string
          input_context?: Json | null
          project_id?: string
          prompt_text?: string | null
          response_data?: Json | null
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          api_name: string
          created_at: string
          id: string
          input_token_cost_micros: number | null
          is_image_generation: boolean
          is_thinking: boolean
          is_vision: boolean
          max_tokens: number | null
          name: string
          notes: string | null
          output_token_cost_micros: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          api_name: string
          created_at?: string
          id?: string
          input_token_cost_micros?: number | null
          is_image_generation?: boolean
          is_thinking?: boolean
          is_vision?: boolean
          max_tokens?: number | null
          name: string
          notes?: string | null
          output_token_cost_micros?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          api_name?: string
          created_at?: string
          id?: string
          input_token_cost_micros?: number | null
          is_image_generation?: boolean
          is_thinking?: boolean
          is_vision?: boolean
          max_tokens?: number | null
          name?: string
          notes?: string | null
          output_token_cost_micros?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_models_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "ai_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          project_id: string | null
          prompt_text: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          prompt_text: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          prompt_text?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_vendors: {
        Row: {
          api_key_env_var: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          api_key_env_var?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          api_key_env_var?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          order: number
          project_id: string
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          order: number
          project_id: string
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          project_id?: string
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          appearance: string | null
          backstory: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          motivations: string | null
          name: string
          nickname: string | null
          notes: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          appearance?: string | null
          backstory?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          motivations?: string | null
          name: string
          nickname?: string | null
          notes?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          appearance?: string | null
          backstory?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          motivations?: string | null
          name?: string
          nickname?: string | null
          notes?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          id: string
          profile_id: string
          credits_amount: number
          source: string
          stripe_charge_id: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          credits_amount: number
          source: string
          stripe_charge_id?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          credits_amount?: number
          source?: string
          stripe_charge_id?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      processed_stripe_events: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_site_admin: boolean
          pen_name: string | null
          updated_at: string
          username: string | null
          credit_balance: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          stripe_subscription_status: string | null
          stripe_current_period_end: string | null
          has_unlimited_credits: boolean
          onboarding_completed: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_site_admin?: boolean
          pen_name?: string | null
          updated_at?: string
          username?: string | null
          credit_balance?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_status?: string | null
          stripe_current_period_end?: string | null
          has_unlimited_credits?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_site_admin?: boolean
          pen_name?: string | null
          updated_at?: string
          username?: string | null
          credit_balance?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_status?: string | null
          stripe_current_period_end?: string | null
          has_unlimited_credits?: boolean
          onboarding_completed?: boolean
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          genre: string | null
          genre_id: number | null
          id: string
          log_line: string | null
          one_page_synopsis: string | null
          settings: Json | null
          target_word_count: number | null
          title: string
          updated_at: string
          user_id: string
          word_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          genre?: string | null
          genre_id?: number | null
          id?: string
          log_line?: string | null
          one_page_synopsis?: string | null
          settings?: Json | null
          target_word_count?: number | null
          title: string
          updated_at?: string
          user_id: string
          word_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          genre?: string | null
          genre_id?: number | null
          id?: string
          log_line?: string | null
          one_page_synopsis?: string | null
          settings?: Json | null
          target_word_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_genre"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_applied_tags: {
        Row: {
          created_at: string
          scene_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          scene_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          scene_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_applied_tags_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_applied_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "scene_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_characters: {
        Row: {
          character_id: string
          created_at: string
          scene_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          scene_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_characters_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scene_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          chapter_id: string
          content: string | null
          created_at: string
          id: string
          notes: string | null
          order: number
          outline_description: string | null
          pov_character_id: string | null
          primary_category:
            | Database["public"]["Enums"]["primary_scene_category_enum"]
            | null
          title: string | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          chapter_id: string
          content?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order: number
          outline_description?: string | null
          pov_character_id?: string | null
          primary_category?:
            | Database["public"]["Enums"]["primary_scene_category_enum"]
            | null
          title?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          chapter_id?: string
          content?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order?: number
          outline_description?: string | null
          pov_character_id?: string | null
          primary_category?:
            | Database["public"]["Enums"]["primary_scene_category_enum"]
            | null
          title?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_pov_character_id_fkey"
            columns: ["pov_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          id: number
          stripe_price_id: string
          name: string
          credits_granted: number
          created_at: string
        }
        Insert: {
          id?: number
          stripe_price_id: string
          name: string
          credits_granted?: number
          created_at?: string
        }
        Update: {
          id?: number
          stripe_price_id?: string
          name?: string
          credits_granted?: number
          created_at?: string
        }
        Relationships: []
      }
      tool_model: {
        Row: {
          created_at: string
          id: string
          model_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          model_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          model_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_model_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      world_building_notes: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_building_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_full_outline: {
        Args: { p_project_id: string; p_user_id: string; outline_data: Json }
        Returns: undefined
      }
      handle_credit_transaction: {
        Args: {
          profile_id_in: string
          amount_in: number
          source_in: string
          expires_in_days_in?: number | null
        }
        Returns: { id: string; email: string | null; credit_balance: number }[]
      }
    }
    Enums: {
      primary_scene_category_enum:
        | "Action"
        | "Dialogue"
        | "Reflection"
        | "Discovery"
        | "Relationship"
        | "Transition"
        | "Worldbuilding"
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
      primary_scene_category_enum: [
        "Action",
        "Dialogue",
        "Reflection",
        "Discovery",
        "Relationship",
        "Transition",
        "Worldbuilding",
      ],
    },
  },
} as const

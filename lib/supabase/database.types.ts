export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
          notes: Json | null
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
          notes?: Json | null
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
          notes?: Json | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_period_credit_usage: number
          full_name: string | null
          id: string
          is_site_admin: boolean
          total_credit_usage: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_period_credit_usage?: number
          full_name?: string | null
          id: string
          is_site_admin?: boolean
          total_credit_usage?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_period_credit_usage?: number
          full_name?: string | null
          id?: string
          is_site_admin?: boolean
          total_credit_usage?: number
          updated_at?: string
          username?: string | null
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
      increment_credit_usage: {
        Args: {
          user_id_to_update: string
          credits_to_add: number
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never


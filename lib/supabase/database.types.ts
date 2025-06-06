// Generated types for Supabase Database
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          is_site_admin: boolean
          current_period_credit_usage: number
          total_credit_usage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_site_admin?: boolean
          current_period_credit_usage?: number
          total_credit_usage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_site_admin?: boolean
          current_period_credit_usage?: number
          total_credit_usage?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed from migrations
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

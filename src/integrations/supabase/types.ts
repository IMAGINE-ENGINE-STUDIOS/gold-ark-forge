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
      attestations: {
        Row: {
          authority_name: string
          bar_id: string
          created_at: string
          document_hash: string
          document_url: string | null
          id: string
          valid_until: string | null
        }
        Insert: {
          authority_name: string
          bar_id: string
          created_at?: string
          document_hash: string
          document_url?: string | null
          id?: string
          valid_until?: string | null
        }
        Update: {
          authority_name?: string
          bar_id?: string
          created_at?: string
          document_hash?: string
          document_url?: string | null
          id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attestations_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bullion_bars"
            referencedColumns: ["id"]
          },
        ]
      }
      bullion_bars: {
        Row: {
          created_at: string
          custody_status: Database["public"]["Enums"]["custody_status"]
          id: string
          jurisdiction: string
          last_verified_at: string | null
          metal_type: Database["public"]["Enums"]["metal_type"]
          price_per_oz: number | null
          purity: number
          serial_number: string
          vault_id: string
          weight_oz: number
        }
        Insert: {
          created_at?: string
          custody_status?: Database["public"]["Enums"]["custody_status"]
          id?: string
          jurisdiction?: string
          last_verified_at?: string | null
          metal_type: Database["public"]["Enums"]["metal_type"]
          price_per_oz?: number | null
          purity?: number
          serial_number: string
          vault_id: string
          weight_oz: number
        }
        Update: {
          created_at?: string
          custody_status?: Database["public"]["Enums"]["custody_status"]
          id?: string
          jurisdiction?: string
          last_verified_at?: string | null
          metal_type?: Database["public"]["Enums"]["metal_type"]
          price_per_oz?: number | null
          purity?: number
          serial_number?: string
          vault_id?: string
          weight_oz?: number
        }
        Relationships: []
      }
      price_feeds: {
        Row: {
          change_24h: number | null
          id: string
          metal_type: Database["public"]["Enums"]["metal_type"]
          price_usd: number
          updated_at: string
        }
        Insert: {
          change_24h?: number | null
          id?: string
          metal_type: Database["public"]["Enums"]["metal_type"]
          price_usd: number
          updated_at?: string
        }
        Update: {
          change_24h?: number | null
          id?: string
          metal_type?: Database["public"]["Enums"]["metal_type"]
          price_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      reserve_snapshots: {
        Row: {
          bar_count: number
          bitcoin_txid: string | null
          created_at: string
          id: string
          merkle_root: string
          snapshot_id: string
          total_gold_oz: number
          total_platinum_oz: number
          total_silver_oz: number
        }
        Insert: {
          bar_count?: number
          bitcoin_txid?: string | null
          created_at?: string
          id?: string
          merkle_root: string
          snapshot_id: string
          total_gold_oz?: number
          total_platinum_oz?: number
          total_silver_oz?: number
        }
        Update: {
          bar_count?: number
          bitcoin_txid?: string | null
          created_at?: string
          id?: string
          merkle_root?: string
          snapshot_id?: string
          total_gold_oz?: number
          total_platinum_oz?: number
          total_silver_oz?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_holdings: {
        Row: {
          acquired_at: string
          bar_id: string
          id: string
          status: Database["public"]["Enums"]["holding_status"]
          wallet_address: string
        }
        Insert: {
          acquired_at?: string
          bar_id: string
          id?: string
          status?: Database["public"]["Enums"]["holding_status"]
          wallet_address: string
        }
        Update: {
          acquired_at?: string
          bar_id?: string
          id?: string
          status?: Database["public"]["Enums"]["holding_status"]
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_holdings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bullion_bars"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      custody_status: "free" | "pledged" | "redeemed"
      holding_status: "active" | "pending_redemption" | "redeemed"
      metal_type: "gold" | "silver" | "platinum"
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
      app_role: ["admin", "user"],
      custody_status: ["free", "pledged", "redeemed"],
      holding_status: ["active", "pending_redemption", "redeemed"],
      metal_type: ["gold", "silver", "platinum"],
    },
  },
} as const

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
      anchor_leaves: {
        Row: {
          anchor_id: string
          anchor_leaf_id: string
          created_at: string
          event_id: string
          leaf_hash: string
          leaf_index: number
        }
        Insert: {
          anchor_id: string
          anchor_leaf_id?: string
          created_at?: string
          event_id: string
          leaf_hash: string
          leaf_index: number
        }
        Update: {
          anchor_id?: string
          anchor_leaf_id?: string
          created_at?: string
          event_id?: string
          leaf_hash?: string
          leaf_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "anchor_leaves_anchor_id_fkey"
            columns: ["anchor_id"]
            isOneToOne: false
            referencedRelation: "anchors"
            referencedColumns: ["anchor_id"]
          },
          {
            foreignKeyName: "anchor_leaves_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "certificate_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      anchors: {
        Row: {
          anchor_id: string
          commit_height: number | null
          commit_time: string | null
          commit_txid: string | null
          created_at: string
          leaf_count: number
          merkle_root: string
          status: Database["public"]["Enums"]["anchor_status"]
        }
        Insert: {
          anchor_id?: string
          commit_height?: number | null
          commit_time?: string | null
          commit_txid?: string | null
          created_at?: string
          leaf_count?: number
          merkle_root: string
          status?: Database["public"]["Enums"]["anchor_status"]
        }
        Update: {
          anchor_id?: string
          commit_height?: number | null
          commit_time?: string | null
          commit_txid?: string | null
          created_at?: string
          leaf_count?: number
          merkle_root?: string
          status?: Database["public"]["Enums"]["anchor_status"]
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string
          actor_type: string
          audit_id: string
          created_at: string
          details_json: Json
          ip_addr: unknown
          resource_id: string
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_type: string
          audit_id?: string
          created_at?: string
          details_json?: Json
          ip_addr?: unknown
          resource_id: string
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_type?: string
          audit_id?: string
          created_at?: string
          details_json?: Json
          ip_addr?: unknown
          resource_id?: string
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      broker_connections: {
        Row: {
          api_key: string
          api_secret: string
          broker: string
          created_at: string
          environment: string
          id: string
          is_active: boolean
          label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_secret: string
          broker?: string
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_secret?: string
          broker?: string
          created_at?: string
          environment?: string
          id?: string
          is_active?: boolean
          label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_orders: {
        Row: {
          broker_order_id: string | null
          broker_response: Json | null
          connection_id: string
          created_at: string
          filled_avg_price: number | null
          filled_qty: number | null
          id: string
          limit_price: number | null
          order_type: string
          qty: number
          side: string
          status: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_order_id?: string | null
          broker_response?: Json | null
          connection_id: string
          created_at?: string
          filled_avg_price?: number | null
          filled_qty?: number | null
          id?: string
          limit_price?: number | null
          order_type?: string
          qty: number
          side: string
          status?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_order_id?: string | null
          broker_response?: Json | null
          connection_id?: string
          created_at?: string
          filled_avg_price?: number | null
          filled_qty?: number | null
          id?: string
          limit_price?: number | null
          order_type?: string
          qty?: number
          side?: string
          status?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "broker_connections"
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
      certificate_events: {
        Row: {
          actor_wallet_id: string | null
          cert_id: string
          created_at: string
          event_id: string
          event_payload: Json
          event_type: string
          partner_id: string | null
          partner_sig: string | null
        }
        Insert: {
          actor_wallet_id?: string | null
          cert_id: string
          created_at?: string
          event_id?: string
          event_payload?: Json
          event_type: string
          partner_id?: string | null
          partner_sig?: string | null
        }
        Update: {
          actor_wallet_id?: string | null
          cert_id?: string
          created_at?: string
          event_id?: string
          event_payload?: Json
          event_type?: string
          partner_id?: string | null
          partner_sig?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_events_actor_wallet_id_fkey"
            columns: ["actor_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "certificate_events_cert_id_fkey"
            columns: ["cert_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["cert_id"]
          },
          {
            foreignKeyName: "certificate_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      certificates: {
        Row: {
          cert_id: string
          cert_version: number
          issued_at: string
          metadata_json: Json
          owner_wallet_id: string
          partner_id: string
          partner_sig: string
          partner_sig_alg: string
          status: Database["public"]["Enums"]["cert_status"]
          updated_at: string
        }
        Insert: {
          cert_id?: string
          cert_version?: number
          issued_at?: string
          metadata_json?: Json
          owner_wallet_id: string
          partner_id: string
          partner_sig: string
          partner_sig_alg: string
          status?: Database["public"]["Enums"]["cert_status"]
          updated_at?: string
        }
        Update: {
          cert_id?: string
          cert_version?: number
          issued_at?: string
          metadata_json?: Json
          owner_wallet_id?: string
          partner_id?: string
          partner_sig?: string
          partner_sig_alg?: string
          status?: Database["public"]["Enums"]["cert_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_owner_wallet_id_fkey"
            columns: ["owner_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "certificates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          dispute_id: string
          resolution: string | null
          status: string
          transfer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dispute_id?: string
          resolution?: string | null
          status?: string
          transfer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          resolution?: string | null
          status?: string
          transfer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["transfer_id"]
          },
        ]
      }
      partner_sites: {
        Row: {
          address_text: string | null
          created_at: string
          partner_id: string
          region: string
          site_id: string
          site_name: string
          status: string
        }
        Insert: {
          address_text?: string | null
          created_at?: string
          partner_id: string
          region: string
          site_id?: string
          site_name: string
          status?: string
        }
        Update: {
          address_text?: string | null
          created_at?: string
          partner_id?: string
          region?: string
          site_id?: string
          site_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_sites_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["partner_id"]
          },
        ]
      }
      partners: {
        Row: {
          api_base_url: string
          created_at: string
          jurisdiction: string
          legal_name: string
          mtls_spki_fingerprint: string | null
          partner_id: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          status: Database["public"]["Enums"]["partner_status"]
          updated_at: string
        }
        Insert: {
          api_base_url: string
          created_at?: string
          jurisdiction: string
          legal_name: string
          mtls_spki_fingerprint?: string | null
          partner_id?: string
          partner_type: Database["public"]["Enums"]["partner_type"]
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
        }
        Update: {
          api_base_url?: string
          created_at?: string
          jurisdiction?: string
          legal_name?: string
          mtls_spki_fingerprint?: string | null
          partner_id?: string
          partner_type?: Database["public"]["Enums"]["partner_type"]
          status?: Database["public"]["Enums"]["partner_status"]
          updated_at?: string
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
      siwe_nonces: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
          used: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          nonce: string
          used?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
          used?: boolean
        }
        Relationships: []
      }
      transfers: {
        Row: {
          btc_txid: string | null
          buyer_wallet_id: string
          cert_id: string
          created_at: string
          psbt_base64: string | null
          seller_wallet_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          terms_json: Json
          transfer_id: string
          updated_at: string
        }
        Insert: {
          btc_txid?: string | null
          buyer_wallet_id: string
          cert_id: string
          created_at?: string
          psbt_base64?: string | null
          seller_wallet_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          terms_json?: Json
          transfer_id?: string
          updated_at?: string
        }
        Update: {
          btc_txid?: string | null
          buyer_wallet_id?: string
          cert_id?: string
          created_at?: string
          psbt_base64?: string | null
          seller_wallet_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          terms_json?: Json
          transfer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_buyer_wallet_id_fkey"
            columns: ["buyer_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_id"]
          },
          {
            foreignKeyName: "transfers_cert_id_fkey"
            columns: ["cert_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["cert_id"]
          },
          {
            foreignKeyName: "transfers_seller_wallet_id_fkey"
            columns: ["seller_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
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
      wallets: {
        Row: {
          address: string
          created_at: string
          last_seen_at: string | null
          wallet_id: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Insert: {
          address: string
          created_at?: string
          last_seen_at?: string | null
          wallet_id?: string
          wallet_type: Database["public"]["Enums"]["wallet_type"]
        }
        Update: {
          address?: string
          created_at?: string
          last_seen_at?: string | null
          wallet_id?: string
          wallet_type?: Database["public"]["Enums"]["wallet_type"]
        }
        Relationships: []
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
      anchor_status:
        | "pending"
        | "broadcast"
        | "confirmed"
        | "reorged"
        | "abandoned"
      app_role: "admin" | "user"
      cert_status: "active" | "frozen" | "revoked" | "redeemed"
      custody_status: "free" | "pledged" | "redeemed"
      holding_status: "active" | "pending_redemption" | "redeemed"
      metal_type: "gold" | "silver" | "platinum"
      partner_status: "active" | "suspended" | "offboarded"
      partner_type: "vault" | "dealer" | "custodian" | "arbiter"
      transfer_status:
        | "proposed"
        | "btc_settlement_pending"
        | "partner_review"
        | "completed"
        | "cancelled"
        | "expired"
        | "disputed"
      wallet_type: "evm" | "btc"
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
      anchor_status: [
        "pending",
        "broadcast",
        "confirmed",
        "reorged",
        "abandoned",
      ],
      app_role: ["admin", "user"],
      cert_status: ["active", "frozen", "revoked", "redeemed"],
      custody_status: ["free", "pledged", "redeemed"],
      holding_status: ["active", "pending_redemption", "redeemed"],
      metal_type: ["gold", "silver", "platinum"],
      partner_status: ["active", "suspended", "offboarded"],
      partner_type: ["vault", "dealer", "custodian", "arbiter"],
      transfer_status: [
        "proposed",
        "btc_settlement_pending",
        "partner_review",
        "completed",
        "cancelled",
        "expired",
        "disputed",
      ],
      wallet_type: ["evm", "btc"],
    },
  },
} as const

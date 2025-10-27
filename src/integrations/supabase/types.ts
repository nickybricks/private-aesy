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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          beta: number | null
          ceo: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          current_price: number | null
          cusip: string | null
          description: string | null
          exchange: string | null
          float_shares: number | null
          full_time_employees: number | null
          id: string
          industry: string | null
          ipo_date: string | null
          isin: string | null
          last_updated: string | null
          market_cap: number | null
          raw_profile_data: Json | null
          sector: string | null
          shares_outstanding: number | null
          symbol: string
          website: string | null
        }
        Insert: {
          beta?: number | null
          ceo?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          cusip?: string | null
          description?: string | null
          exchange?: string | null
          float_shares?: number | null
          full_time_employees?: number | null
          id?: string
          industry?: string | null
          ipo_date?: string | null
          isin?: string | null
          last_updated?: string | null
          market_cap?: number | null
          raw_profile_data?: Json | null
          sector?: string | null
          shares_outstanding?: number | null
          symbol: string
          website?: string | null
        }
        Update: {
          beta?: number | null
          ceo?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          cusip?: string | null
          description?: string | null
          exchange?: string | null
          float_shares?: number | null
          full_time_employees?: number | null
          id?: string
          industry?: string | null
          ipo_date?: string | null
          isin?: string | null
          last_updated?: string | null
          market_cap?: number | null
          raw_profile_data?: Json | null
          sector?: string | null
          shares_outstanding?: number | null
          symbol?: string
          website?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string | null
          fetched_at: string
          id: string
          is_fallback: boolean | null
          rate: number
          target_currency: string
          updated_at: string | null
        }
        Insert: {
          base_currency?: string
          created_at?: string | null
          fetched_at?: string
          id?: string
          is_fallback?: boolean | null
          rate: number
          target_currency: string
          updated_at?: string | null
        }
        Update: {
          base_currency?: string
          created_at?: string | null
          fetched_at?: string
          id?: string
          is_fallback?: boolean | null
          rate?: number
          target_currency?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_data_quarterly: {
        Row: {
          asset_turnover: number | null
          book_value_per_share: number | null
          calendar_year: number
          capex: number | null
          cash_and_equivalents: number | null
          cash_conversion_cycle: number | null
          cash_ratio: number | null
          created_at: string
          current_assets: number | null
          current_liabilities: number | null
          current_ratio: number | null
          data_quality_score: number | null
          data_source: string
          days_inventory_outstanding: number | null
          days_payables_outstanding: number | null
          days_sales_outstanding: number | null
          debt_to_assets: number | null
          debt_to_equity: number | null
          dividend_per_share: number | null
          dividend_yield: number | null
          ebit: number | null
          ebitda: number | null
          enterprise_value: number | null
          eps: number | null
          eps_diluted: number | null
          eps_wo_nri: number | null
          ev_to_ebitda: number | null
          ev_to_operating_cash_flow: number | null
          ev_to_sales: number | null
          fiscal_date: string
          fmp_filing_date: string | null
          free_cash_flow: number | null
          fx_rate_to_usd: number | null
          goodwill_impairment: number | null
          gross_profit_margin: number | null
          id: string
          impairment_of_assets: number | null
          income_before_tax: number | null
          income_tax_expense: number | null
          interest_coverage: number | null
          interest_expense: number | null
          inventory_turnover: number | null
          invested_capital: number | null
          is_ttm: boolean
          long_term_debt: number | null
          market_cap: number | null
          missing_fields: string[] | null
          net_debt_to_ebitda: number | null
          net_income: number | null
          net_profit_margin: number | null
          nopat: number | null
          operating_cash_flow: number | null
          operating_profit_margin: number | null
          payout_ratio: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          peg_ratio: number | null
          period: string
          pfcf_ratio: number | null
          ps_ratio: number | null
          quick_ratio: number | null
          raw_data_balance: Json | null
          raw_data_cashflow: Json | null
          raw_data_income: Json | null
          raw_data_profile: Json | null
          raw_key_metrics: Json | null
          raw_ratios: Json | null
          receivables_turnover: number | null
          reported_currency: string
          restructuring_charges: number | null
          return_on_assets: number | null
          return_on_capital_employed: number | null
          return_on_equity: number | null
          return_on_invested_capital: number | null
          revenue: number | null
          short_term_debt: number | null
          stock_price_close: number | null
          stock_price_date: string | null
          symbol: string
          tax_rate: number | null
          total_assets: number | null
          total_debt: number | null
          total_equity: number | null
          unusual_items: number | null
          updated_at: string
          wacc: number | null
          weighted_avg_shares_diluted: number | null
        }
        Insert: {
          asset_turnover?: number | null
          book_value_per_share?: number | null
          calendar_year: number
          capex?: number | null
          cash_and_equivalents?: number | null
          cash_conversion_cycle?: number | null
          cash_ratio?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          data_quality_score?: number | null
          data_source?: string
          days_inventory_outstanding?: number | null
          days_payables_outstanding?: number | null
          days_sales_outstanding?: number | null
          debt_to_assets?: number | null
          debt_to_equity?: number | null
          dividend_per_share?: number | null
          dividend_yield?: number | null
          ebit?: number | null
          ebitda?: number | null
          enterprise_value?: number | null
          eps?: number | null
          eps_diluted?: number | null
          eps_wo_nri?: number | null
          ev_to_ebitda?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fiscal_date: string
          fmp_filing_date?: string | null
          free_cash_flow?: number | null
          fx_rate_to_usd?: number | null
          goodwill_impairment?: number | null
          gross_profit_margin?: number | null
          id?: string
          impairment_of_assets?: number | null
          income_before_tax?: number | null
          income_tax_expense?: number | null
          interest_coverage?: number | null
          interest_expense?: number | null
          inventory_turnover?: number | null
          invested_capital?: number | null
          is_ttm?: boolean
          long_term_debt?: number | null
          market_cap?: number | null
          missing_fields?: string[] | null
          net_debt_to_ebitda?: number | null
          net_income?: number | null
          net_profit_margin?: number | null
          nopat?: number | null
          operating_cash_flow?: number | null
          operating_profit_margin?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          peg_ratio?: number | null
          period: string
          pfcf_ratio?: number | null
          ps_ratio?: number | null
          quick_ratio?: number | null
          raw_data_balance?: Json | null
          raw_data_cashflow?: Json | null
          raw_data_income?: Json | null
          raw_data_profile?: Json | null
          raw_key_metrics?: Json | null
          raw_ratios?: Json | null
          receivables_turnover?: number | null
          reported_currency: string
          restructuring_charges?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          revenue?: number | null
          short_term_debt?: number | null
          stock_price_close?: number | null
          stock_price_date?: string | null
          symbol: string
          tax_rate?: number | null
          total_assets?: number | null
          total_debt?: number | null
          total_equity?: number | null
          unusual_items?: number | null
          updated_at?: string
          wacc?: number | null
          weighted_avg_shares_diluted?: number | null
        }
        Update: {
          asset_turnover?: number | null
          book_value_per_share?: number | null
          calendar_year?: number
          capex?: number | null
          cash_and_equivalents?: number | null
          cash_conversion_cycle?: number | null
          cash_ratio?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          data_quality_score?: number | null
          data_source?: string
          days_inventory_outstanding?: number | null
          days_payables_outstanding?: number | null
          days_sales_outstanding?: number | null
          debt_to_assets?: number | null
          debt_to_equity?: number | null
          dividend_per_share?: number | null
          dividend_yield?: number | null
          ebit?: number | null
          ebitda?: number | null
          enterprise_value?: number | null
          eps?: number | null
          eps_diluted?: number | null
          eps_wo_nri?: number | null
          ev_to_ebitda?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fiscal_date?: string
          fmp_filing_date?: string | null
          free_cash_flow?: number | null
          fx_rate_to_usd?: number | null
          goodwill_impairment?: number | null
          gross_profit_margin?: number | null
          id?: string
          impairment_of_assets?: number | null
          income_before_tax?: number | null
          income_tax_expense?: number | null
          interest_coverage?: number | null
          interest_expense?: number | null
          inventory_turnover?: number | null
          invested_capital?: number | null
          is_ttm?: boolean
          long_term_debt?: number | null
          market_cap?: number | null
          missing_fields?: string[] | null
          net_debt_to_ebitda?: number | null
          net_income?: number | null
          net_profit_margin?: number | null
          nopat?: number | null
          operating_cash_flow?: number | null
          operating_profit_margin?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          peg_ratio?: number | null
          period?: string
          pfcf_ratio?: number | null
          ps_ratio?: number | null
          quick_ratio?: number | null
          raw_data_balance?: Json | null
          raw_data_cashflow?: Json | null
          raw_data_income?: Json | null
          raw_data_profile?: Json | null
          raw_key_metrics?: Json | null
          raw_ratios?: Json | null
          receivables_turnover?: number | null
          reported_currency?: string
          restructuring_charges?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          revenue?: number | null
          short_term_debt?: number | null
          stock_price_close?: number | null
          stock_price_date?: string | null
          symbol?: string
          tax_rate?: number | null
          total_assets?: number | null
          total_debt?: number | null
          total_equity?: number | null
          unusual_items?: number | null
          updated_at?: string
          wacc?: number | null
          weighted_avg_shares_diluted?: number | null
        }
        Relationships: []
      }
      industry_metrics: {
        Row: {
          created_at: string
          date: string
          exchange: string | null
          id: string
          industry: string
          pe_ratio: number | null
        }
        Insert: {
          created_at?: string
          date: string
          exchange?: string | null
          id?: string
          industry: string
          pe_ratio?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          exchange?: string | null
          id?: string
          industry?: string
          pe_ratio?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_analyses: {
        Row: {
          analysis_data: Json
          company_name: string
          created_at: string
          id: string
          saved_at: string
          ticker: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          company_name: string
          created_at?: string
          id?: string
          saved_at?: string
          ticker: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          company_name?: string
          created_at?: string
          id?: string
          saved_at?: string
          ticker?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_analysis_cache: {
        Row: {
          analysis_result: Json
          buffett_score: number | null
          created_at: string
          id: string
          last_updated: string
          market_id: string
          symbol: string
        }
        Insert: {
          analysis_result: Json
          buffett_score?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          market_id: string
          symbol: string
        }
        Update: {
          analysis_result?: Json
          buffett_score?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          market_id?: string
          symbol?: string
        }
        Relationships: []
      }
      stock_data_cache: {
        Row: {
          company_name: string | null
          created_at: string
          currency: string | null
          exchange: string | null
          id: string
          last_updated: string
          raw_data: Json
          sector: string | null
          symbol: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          currency?: string | null
          exchange?: string | null
          id?: string
          last_updated?: string
          raw_data: Json
          sector?: string | null
          symbol: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          currency?: string | null
          exchange?: string | null
          id?: string
          last_updated?: string
          raw_data?: Json
          sector?: string | null
          symbol?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stocks: {
        Row: {
          analysis_data: Json | null
          buffett_score: number | null
          company_name: string | null
          created_at: string
          id: string
          last_analysis_date: string | null
          notes: string | null
          symbol: string
          updated_at: string
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          buffett_score?: number | null
          company_name?: string | null
          created_at?: string
          id?: string
          last_analysis_date?: string | null
          notes?: string | null
          symbol: string
          updated_at?: string
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          buffett_score?: number | null
          company_name?: string | null
          created_at?: string
          id?: string
          last_analysis_date?: string | null
          notes?: string | null
          symbol?: string
          updated_at?: string
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stocks_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "customer" | "admin" | "super_admin"
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
      user_role: ["customer", "admin", "super_admin"],
    },
  },
} as const

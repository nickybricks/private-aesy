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
          valid_date: string
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
          valid_date?: string
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
          valid_date?: string
        }
        Relationships: []
      }
      financial_data_quarterly: {
        Row: {
          accepted_date: string | null
          accounts_payable: number | null
          accounts_payables_change: number | null
          accounts_receivable: number | null
          accounts_receivables_change: number | null
          accumulated_other_comprehensive_income_loss: number | null
          acquisitions_net: number | null
          asset_turnover: number | null
          average_inventory: number | null
          average_payables: number | null
          average_receivables: number | null
          book_value_per_share: number | null
          bottom_line_net_income: number | null
          calendar_year: number
          capex: number | null
          capex_per_share: number | null
          capex_to_depreciation: number | null
          capex_to_operating_cash_flow: number | null
          capex_to_operating_income: number | null
          capex_to_revenue: number | null
          capital_expenditure_coverage_ratio: number | null
          capital_lease_obligations: number | null
          cash_and_equivalents: number | null
          cash_conversion_cycle: number | null
          cash_flow_to_debt_ratio: number | null
          cash_per_share: number | null
          cash_per_share_ratio: number | null
          cash_ratio: number | null
          change_in_working_capital: number | null
          common_stock: number | null
          company_equity_multiplier: number | null
          cost_and_expenses: number | null
          cost_of_revenue: number | null
          created_at: string
          current_assets: number | null
          current_liabilities: number | null
          current_ratio: number | null
          data_quality_score: number | null
          data_source: string
          days_inventory_outstanding: number | null
          days_of_inventory_outstanding_ratio: number | null
          days_of_payables_outstanding_ratio: number | null
          days_of_sales_outstanding_ratio: number | null
          days_payables_outstanding: number | null
          days_sales_outstanding: number | null
          debt_repayment: number | null
          debt_to_assets: number | null
          debt_to_equity: number | null
          debt_to_market_cap: number | null
          deferred_income_tax: number | null
          deferred_revenue: number | null
          deferred_revenue_non_current: number | null
          deferred_tax_liabilities_non_current: number | null
          dividend_paid_and_capex_coverage_ratio: number | null
          dividend_payments_coverage_ratio: number | null
          dividend_per_share: number | null
          dividend_per_share_ratio: number | null
          dividend_yield: number | null
          earnings_yield: number | null
          ebit: number | null
          ebit_per_revenue: number | null
          ebitda: number | null
          ebitda_margin: number | null
          effect_of_forex_changes_on_cash: number | null
          effective_tax_rate: number | null
          enterprise_value: number | null
          eps: number | null
          eps_corrected: number | null
          eps_diluted: number | null
          eps_wo_nri: number | null
          ev_to_ebitda: number | null
          ev_to_operating_cash_flow: number | null
          ev_to_sales: number | null
          fcf_yield: number | null
          filing_date: string | null
          fiscal_date: string
          fiscal_year: string | null
          fixed_asset_turnover: number | null
          fmp_filing_date: string | null
          free_cash_flow: number | null
          free_cash_flow_operating_cash_flow_ratio: number | null
          free_cash_flow_per_share: number | null
          free_cash_flow_per_share_ratio: number | null
          fx_rate_to_usd: number | null
          general_and_administrative_expenses: number | null
          goodwill: number | null
          goodwill_impairment: number | null
          graham_net_net: number | null
          graham_number: number | null
          gross_profit: number | null
          gross_profit_margin: number | null
          id: string
          impairment_of_assets: number | null
          income_before_tax: number | null
          income_tax_expense: number | null
          intangible_assets: number | null
          intangibles_to_total_assets: number | null
          interest_coverage: number | null
          interest_debt_per_share: number | null
          interest_expense: number | null
          interest_income: number | null
          inventory: number | null
          inventory_change: number | null
          inventory_turnover: number | null
          invested_capital: number | null
          invested_capital_metric: number | null
          investments_in_property_plant_and_equipment: number | null
          is_ttm: boolean
          long_term_debt: number | null
          long_term_debt_to_capitalization: number | null
          long_term_investments: number | null
          market_cap: number | null
          minority_interest: number | null
          missing_fields: string[] | null
          net_cash_provided_by_operating_activities: number | null
          net_cash_used_for_investing_activities: number | null
          net_cash_used_provided_by_financing_activities: number | null
          net_change_in_cash: number | null
          net_current_asset_value: number | null
          net_debt: number | null
          net_debt_to_ebitda: number | null
          net_income: number | null
          net_income_before_adjustments: number | null
          net_income_deductions: number | null
          net_income_from_continuing_operations: number | null
          net_income_from_discontinued_operations: number | null
          net_income_per_share: number | null
          net_interest_income: number | null
          net_profit_margin: number | null
          net_profit_margin_ratio: number | null
          non_operating_income_excluding_interest: number | null
          nopat: number | null
          operating_cash_flow: number | null
          operating_cash_flow_per_share: number | null
          operating_cash_flow_sales_ratio: number | null
          operating_cycle: number | null
          operating_expenses: number | null
          operating_profit_margin: number | null
          other_adjustments_to_net_income: number | null
          other_current_assets: number | null
          other_current_liabilities: number | null
          other_expenses: number | null
          other_financing_activities: number | null
          other_investing_activities: number | null
          other_liabilities: number | null
          other_non_cash_items: number | null
          other_non_current_assets: number | null
          other_non_current_liabilities: number | null
          other_total_stockholders_equity: number | null
          other_working_capital_change: number | null
          payables_period: number | null
          payout_ratio: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          pe_ratio_corrected: number | null
          peg_ratio: number | null
          period: string
          pfcf_ratio: number | null
          preferred_stock: number | null
          pretax_profit_margin: number | null
          price_book_value_ratio: number | null
          price_earnings_ratio: number | null
          price_earnings_to_growth_ratio: number | null
          price_fair_value: number | null
          price_sales_ratio: number | null
          price_to_book_ratio: number | null
          price_to_free_cash_flows_ratio: number | null
          price_to_operating_cash_flows_ratio: number | null
          price_to_sales_ratio: number | null
          price_to_sales_ratio_ttm: number | null
          proceeds_from_issuance_of_common_stock: number | null
          proceeds_from_issuance_of_debt: number | null
          proceeds_from_repurchase_of_equity: number | null
          property_plant_equipment_net: number | null
          ps_ratio: number | null
          purchases_of_investments: number | null
          quick_ratio: number | null
          raw_data_balance: Json | null
          raw_data_cashflow: Json | null
          raw_data_income: Json | null
          raw_data_profile: Json | null
          raw_key_metrics: Json | null
          raw_ratios: Json | null
          receivables_period: number | null
          receivables_turnover: number | null
          reported_currency: string
          research_and_development_expenses: number | null
          research_and_development_to_revenue: number | null
          restructuring_charges: number | null
          retained_earnings: number | null
          return_on_assets: number | null
          return_on_capital_employed: number | null
          return_on_equity: number | null
          return_on_invested_capital: number | null
          revenue: number | null
          revenue_per_share: number | null
          sales_general_and_administrative_to_revenue: number | null
          sales_maturities_of_investments: number | null
          selling_and_marketing_expenses: number | null
          selling_general_and_administrative_expenses: number | null
          shareholders_equity_per_share: number | null
          short_term_coverage_ratios: number | null
          short_term_debt: number | null
          short_term_investments: number | null
          stock_based_compensation: number | null
          stock_based_compensation_to_revenue: number | null
          stock_price_close: number | null
          stock_price_date: string | null
          symbol: string
          tangible_asset_value: number | null
          tangible_book_value_per_share: number | null
          tax_assets: number | null
          tax_rate: number | null
          total_asset_turnover: number | null
          total_assets: number | null
          total_debt: number | null
          total_debt_to_capitalization: number | null
          total_equity: number | null
          total_liabilities: number | null
          total_non_current_assets: number | null
          total_non_current_liabilities: number | null
          total_stockholders_equity: number | null
          treasury_stock: number | null
          unusual_items: number | null
          updated_at: string
          wacc: number | null
          weighted_avg_shares_diluted: number | null
          working_capital: number | null
        }
        Insert: {
          accepted_date?: string | null
          accounts_payable?: number | null
          accounts_payables_change?: number | null
          accounts_receivable?: number | null
          accounts_receivables_change?: number | null
          accumulated_other_comprehensive_income_loss?: number | null
          acquisitions_net?: number | null
          asset_turnover?: number | null
          average_inventory?: number | null
          average_payables?: number | null
          average_receivables?: number | null
          book_value_per_share?: number | null
          bottom_line_net_income?: number | null
          calendar_year: number
          capex?: number | null
          capex_per_share?: number | null
          capex_to_depreciation?: number | null
          capex_to_operating_cash_flow?: number | null
          capex_to_operating_income?: number | null
          capex_to_revenue?: number | null
          capital_expenditure_coverage_ratio?: number | null
          capital_lease_obligations?: number | null
          cash_and_equivalents?: number | null
          cash_conversion_cycle?: number | null
          cash_flow_to_debt_ratio?: number | null
          cash_per_share?: number | null
          cash_per_share_ratio?: number | null
          cash_ratio?: number | null
          change_in_working_capital?: number | null
          common_stock?: number | null
          company_equity_multiplier?: number | null
          cost_and_expenses?: number | null
          cost_of_revenue?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          data_quality_score?: number | null
          data_source?: string
          days_inventory_outstanding?: number | null
          days_of_inventory_outstanding_ratio?: number | null
          days_of_payables_outstanding_ratio?: number | null
          days_of_sales_outstanding_ratio?: number | null
          days_payables_outstanding?: number | null
          days_sales_outstanding?: number | null
          debt_repayment?: number | null
          debt_to_assets?: number | null
          debt_to_equity?: number | null
          debt_to_market_cap?: number | null
          deferred_income_tax?: number | null
          deferred_revenue?: number | null
          deferred_revenue_non_current?: number | null
          deferred_tax_liabilities_non_current?: number | null
          dividend_paid_and_capex_coverage_ratio?: number | null
          dividend_payments_coverage_ratio?: number | null
          dividend_per_share?: number | null
          dividend_per_share_ratio?: number | null
          dividend_yield?: number | null
          earnings_yield?: number | null
          ebit?: number | null
          ebit_per_revenue?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          effect_of_forex_changes_on_cash?: number | null
          effective_tax_rate?: number | null
          enterprise_value?: number | null
          eps?: number | null
          eps_corrected?: number | null
          eps_diluted?: number | null
          eps_wo_nri?: number | null
          ev_to_ebitda?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fcf_yield?: number | null
          filing_date?: string | null
          fiscal_date: string
          fiscal_year?: string | null
          fixed_asset_turnover?: number | null
          fmp_filing_date?: string | null
          free_cash_flow?: number | null
          free_cash_flow_operating_cash_flow_ratio?: number | null
          free_cash_flow_per_share?: number | null
          free_cash_flow_per_share_ratio?: number | null
          fx_rate_to_usd?: number | null
          general_and_administrative_expenses?: number | null
          goodwill?: number | null
          goodwill_impairment?: number | null
          graham_net_net?: number | null
          graham_number?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          id?: string
          impairment_of_assets?: number | null
          income_before_tax?: number | null
          income_tax_expense?: number | null
          intangible_assets?: number | null
          intangibles_to_total_assets?: number | null
          interest_coverage?: number | null
          interest_debt_per_share?: number | null
          interest_expense?: number | null
          interest_income?: number | null
          inventory?: number | null
          inventory_change?: number | null
          inventory_turnover?: number | null
          invested_capital?: number | null
          invested_capital_metric?: number | null
          investments_in_property_plant_and_equipment?: number | null
          is_ttm?: boolean
          long_term_debt?: number | null
          long_term_debt_to_capitalization?: number | null
          long_term_investments?: number | null
          market_cap?: number | null
          minority_interest?: number | null
          missing_fields?: string[] | null
          net_cash_provided_by_operating_activities?: number | null
          net_cash_used_for_investing_activities?: number | null
          net_cash_used_provided_by_financing_activities?: number | null
          net_change_in_cash?: number | null
          net_current_asset_value?: number | null
          net_debt?: number | null
          net_debt_to_ebitda?: number | null
          net_income?: number | null
          net_income_before_adjustments?: number | null
          net_income_deductions?: number | null
          net_income_from_continuing_operations?: number | null
          net_income_from_discontinued_operations?: number | null
          net_income_per_share?: number | null
          net_interest_income?: number | null
          net_profit_margin?: number | null
          net_profit_margin_ratio?: number | null
          non_operating_income_excluding_interest?: number | null
          nopat?: number | null
          operating_cash_flow?: number | null
          operating_cash_flow_per_share?: number | null
          operating_cash_flow_sales_ratio?: number | null
          operating_cycle?: number | null
          operating_expenses?: number | null
          operating_profit_margin?: number | null
          other_adjustments_to_net_income?: number | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_expenses?: number | null
          other_financing_activities?: number | null
          other_investing_activities?: number | null
          other_liabilities?: number | null
          other_non_cash_items?: number | null
          other_non_current_assets?: number | null
          other_non_current_liabilities?: number | null
          other_total_stockholders_equity?: number | null
          other_working_capital_change?: number | null
          payables_period?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          pe_ratio_corrected?: number | null
          peg_ratio?: number | null
          period: string
          pfcf_ratio?: number | null
          preferred_stock?: number | null
          pretax_profit_margin?: number | null
          price_book_value_ratio?: number | null
          price_earnings_ratio?: number | null
          price_earnings_to_growth_ratio?: number | null
          price_fair_value?: number | null
          price_sales_ratio?: number | null
          price_to_book_ratio?: number | null
          price_to_free_cash_flows_ratio?: number | null
          price_to_operating_cash_flows_ratio?: number | null
          price_to_sales_ratio?: number | null
          price_to_sales_ratio_ttm?: number | null
          proceeds_from_issuance_of_common_stock?: number | null
          proceeds_from_issuance_of_debt?: number | null
          proceeds_from_repurchase_of_equity?: number | null
          property_plant_equipment_net?: number | null
          ps_ratio?: number | null
          purchases_of_investments?: number | null
          quick_ratio?: number | null
          raw_data_balance?: Json | null
          raw_data_cashflow?: Json | null
          raw_data_income?: Json | null
          raw_data_profile?: Json | null
          raw_key_metrics?: Json | null
          raw_ratios?: Json | null
          receivables_period?: number | null
          receivables_turnover?: number | null
          reported_currency: string
          research_and_development_expenses?: number | null
          research_and_development_to_revenue?: number | null
          restructuring_charges?: number | null
          retained_earnings?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          revenue?: number | null
          revenue_per_share?: number | null
          sales_general_and_administrative_to_revenue?: number | null
          sales_maturities_of_investments?: number | null
          selling_and_marketing_expenses?: number | null
          selling_general_and_administrative_expenses?: number | null
          shareholders_equity_per_share?: number | null
          short_term_coverage_ratios?: number | null
          short_term_debt?: number | null
          short_term_investments?: number | null
          stock_based_compensation?: number | null
          stock_based_compensation_to_revenue?: number | null
          stock_price_close?: number | null
          stock_price_date?: string | null
          symbol: string
          tangible_asset_value?: number | null
          tangible_book_value_per_share?: number | null
          tax_assets?: number | null
          tax_rate?: number | null
          total_asset_turnover?: number | null
          total_assets?: number | null
          total_debt?: number | null
          total_debt_to_capitalization?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_stockholders_equity?: number | null
          treasury_stock?: number | null
          unusual_items?: number | null
          updated_at?: string
          wacc?: number | null
          weighted_avg_shares_diluted?: number | null
          working_capital?: number | null
        }
        Update: {
          accepted_date?: string | null
          accounts_payable?: number | null
          accounts_payables_change?: number | null
          accounts_receivable?: number | null
          accounts_receivables_change?: number | null
          accumulated_other_comprehensive_income_loss?: number | null
          acquisitions_net?: number | null
          asset_turnover?: number | null
          average_inventory?: number | null
          average_payables?: number | null
          average_receivables?: number | null
          book_value_per_share?: number | null
          bottom_line_net_income?: number | null
          calendar_year?: number
          capex?: number | null
          capex_per_share?: number | null
          capex_to_depreciation?: number | null
          capex_to_operating_cash_flow?: number | null
          capex_to_operating_income?: number | null
          capex_to_revenue?: number | null
          capital_expenditure_coverage_ratio?: number | null
          capital_lease_obligations?: number | null
          cash_and_equivalents?: number | null
          cash_conversion_cycle?: number | null
          cash_flow_to_debt_ratio?: number | null
          cash_per_share?: number | null
          cash_per_share_ratio?: number | null
          cash_ratio?: number | null
          change_in_working_capital?: number | null
          common_stock?: number | null
          company_equity_multiplier?: number | null
          cost_and_expenses?: number | null
          cost_of_revenue?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          data_quality_score?: number | null
          data_source?: string
          days_inventory_outstanding?: number | null
          days_of_inventory_outstanding_ratio?: number | null
          days_of_payables_outstanding_ratio?: number | null
          days_of_sales_outstanding_ratio?: number | null
          days_payables_outstanding?: number | null
          days_sales_outstanding?: number | null
          debt_repayment?: number | null
          debt_to_assets?: number | null
          debt_to_equity?: number | null
          debt_to_market_cap?: number | null
          deferred_income_tax?: number | null
          deferred_revenue?: number | null
          deferred_revenue_non_current?: number | null
          deferred_tax_liabilities_non_current?: number | null
          dividend_paid_and_capex_coverage_ratio?: number | null
          dividend_payments_coverage_ratio?: number | null
          dividend_per_share?: number | null
          dividend_per_share_ratio?: number | null
          dividend_yield?: number | null
          earnings_yield?: number | null
          ebit?: number | null
          ebit_per_revenue?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          effect_of_forex_changes_on_cash?: number | null
          effective_tax_rate?: number | null
          enterprise_value?: number | null
          eps?: number | null
          eps_corrected?: number | null
          eps_diluted?: number | null
          eps_wo_nri?: number | null
          ev_to_ebitda?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fcf_yield?: number | null
          filing_date?: string | null
          fiscal_date?: string
          fiscal_year?: string | null
          fixed_asset_turnover?: number | null
          fmp_filing_date?: string | null
          free_cash_flow?: number | null
          free_cash_flow_operating_cash_flow_ratio?: number | null
          free_cash_flow_per_share?: number | null
          free_cash_flow_per_share_ratio?: number | null
          fx_rate_to_usd?: number | null
          general_and_administrative_expenses?: number | null
          goodwill?: number | null
          goodwill_impairment?: number | null
          graham_net_net?: number | null
          graham_number?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          id?: string
          impairment_of_assets?: number | null
          income_before_tax?: number | null
          income_tax_expense?: number | null
          intangible_assets?: number | null
          intangibles_to_total_assets?: number | null
          interest_coverage?: number | null
          interest_debt_per_share?: number | null
          interest_expense?: number | null
          interest_income?: number | null
          inventory?: number | null
          inventory_change?: number | null
          inventory_turnover?: number | null
          invested_capital?: number | null
          invested_capital_metric?: number | null
          investments_in_property_plant_and_equipment?: number | null
          is_ttm?: boolean
          long_term_debt?: number | null
          long_term_debt_to_capitalization?: number | null
          long_term_investments?: number | null
          market_cap?: number | null
          minority_interest?: number | null
          missing_fields?: string[] | null
          net_cash_provided_by_operating_activities?: number | null
          net_cash_used_for_investing_activities?: number | null
          net_cash_used_provided_by_financing_activities?: number | null
          net_change_in_cash?: number | null
          net_current_asset_value?: number | null
          net_debt?: number | null
          net_debt_to_ebitda?: number | null
          net_income?: number | null
          net_income_before_adjustments?: number | null
          net_income_deductions?: number | null
          net_income_from_continuing_operations?: number | null
          net_income_from_discontinued_operations?: number | null
          net_income_per_share?: number | null
          net_interest_income?: number | null
          net_profit_margin?: number | null
          net_profit_margin_ratio?: number | null
          non_operating_income_excluding_interest?: number | null
          nopat?: number | null
          operating_cash_flow?: number | null
          operating_cash_flow_per_share?: number | null
          operating_cash_flow_sales_ratio?: number | null
          operating_cycle?: number | null
          operating_expenses?: number | null
          operating_profit_margin?: number | null
          other_adjustments_to_net_income?: number | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_expenses?: number | null
          other_financing_activities?: number | null
          other_investing_activities?: number | null
          other_liabilities?: number | null
          other_non_cash_items?: number | null
          other_non_current_assets?: number | null
          other_non_current_liabilities?: number | null
          other_total_stockholders_equity?: number | null
          other_working_capital_change?: number | null
          payables_period?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          pe_ratio_corrected?: number | null
          peg_ratio?: number | null
          period?: string
          pfcf_ratio?: number | null
          preferred_stock?: number | null
          pretax_profit_margin?: number | null
          price_book_value_ratio?: number | null
          price_earnings_ratio?: number | null
          price_earnings_to_growth_ratio?: number | null
          price_fair_value?: number | null
          price_sales_ratio?: number | null
          price_to_book_ratio?: number | null
          price_to_free_cash_flows_ratio?: number | null
          price_to_operating_cash_flows_ratio?: number | null
          price_to_sales_ratio?: number | null
          price_to_sales_ratio_ttm?: number | null
          proceeds_from_issuance_of_common_stock?: number | null
          proceeds_from_issuance_of_debt?: number | null
          proceeds_from_repurchase_of_equity?: number | null
          property_plant_equipment_net?: number | null
          ps_ratio?: number | null
          purchases_of_investments?: number | null
          quick_ratio?: number | null
          raw_data_balance?: Json | null
          raw_data_cashflow?: Json | null
          raw_data_income?: Json | null
          raw_data_profile?: Json | null
          raw_key_metrics?: Json | null
          raw_ratios?: Json | null
          receivables_period?: number | null
          receivables_turnover?: number | null
          reported_currency?: string
          research_and_development_expenses?: number | null
          research_and_development_to_revenue?: number | null
          restructuring_charges?: number | null
          retained_earnings?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          revenue?: number | null
          revenue_per_share?: number | null
          sales_general_and_administrative_to_revenue?: number | null
          sales_maturities_of_investments?: number | null
          selling_and_marketing_expenses?: number | null
          selling_general_and_administrative_expenses?: number | null
          shareholders_equity_per_share?: number | null
          short_term_coverage_ratios?: number | null
          short_term_debt?: number | null
          short_term_investments?: number | null
          stock_based_compensation?: number | null
          stock_based_compensation_to_revenue?: number | null
          stock_price_close?: number | null
          stock_price_date?: string | null
          symbol?: string
          tangible_asset_value?: number | null
          tangible_book_value_per_share?: number | null
          tax_assets?: number | null
          tax_rate?: number | null
          total_asset_turnover?: number | null
          total_assets?: number | null
          total_debt?: number | null
          total_debt_to_capitalization?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_stockholders_equity?: number | null
          treasury_stock?: number | null
          unusual_items?: number | null
          updated_at?: string
          wacc?: number | null
          weighted_avg_shares_diluted?: number | null
          working_capital?: number | null
        }
        Relationships: []
      }
      financial_statements: {
        Row: {
          beta: number | null
          capital_expenditure: number | null
          capital_expenditure_eur: number | null
          capital_expenditure_orig: number | null
          capital_expenditure_usd: number | null
          cash_and_equivalents: number | null
          cash_and_equivalents_eur: number | null
          cash_and_equivalents_orig: number | null
          cash_and_equivalents_usd: number | null
          date: string
          dividends_paid: number | null
          dividends_paid_eur: number | null
          dividends_paid_orig: number | null
          dividends_paid_usd: number | null
          ebit: number | null
          ebit_eur: number | null
          ebit_orig: number | null
          ebit_usd: number | null
          ebitda: number | null
          ebitda_eur: number | null
          ebitda_orig: number | null
          ebitda_usd: number | null
          eps_diluted: number | null
          eps_diluted_eur: number | null
          eps_diluted_orig: number | null
          eps_diluted_usd: number | null
          free_cash_flow: number | null
          free_cash_flow_eur: number | null
          free_cash_flow_orig: number | null
          free_cash_flow_usd: number | null
          id: number
          income_before_tax: number | null
          income_before_tax_eur: number | null
          income_before_tax_orig: number | null
          income_before_tax_usd: number | null
          income_tax_expense: number | null
          income_tax_expense_eur: number | null
          income_tax_expense_orig: number | null
          income_tax_expense_usd: number | null
          interest_expense: number | null
          interest_expense_eur: number | null
          interest_expense_orig: number | null
          interest_expense_usd: number | null
          market_cap: number | null
          name: string | null
          net_income: number | null
          net_income_eur: number | null
          net_income_orig: number | null
          net_income_usd: number | null
          operating_cash_flow: number | null
          operating_cash_flow_eur: number | null
          operating_cash_flow_orig: number | null
          operating_cash_flow_usd: number | null
          other_adjustments_net_income: number | null
          other_adjustments_net_income_eur: number | null
          other_adjustments_net_income_orig: number | null
          other_adjustments_net_income_usd: number | null
          period: string
          reported_currency: string | null
          research_and_development_expenses_eur: number | null
          research_and_development_expenses_orig: number | null
          research_and_development_expenses_usd: number | null
          revenue: number | null
          revenue_eur: number | null
          revenue_orig: number | null
          revenue_usd: number | null
          stock_id: number | null
          symbol: string | null
          total_assets: number | null
          total_assets_eur: number | null
          total_assets_orig: number | null
          total_assets_usd: number | null
          total_current_assets: number | null
          total_current_assets_eur: number | null
          total_current_assets_orig: number | null
          total_current_assets_usd: number | null
          total_current_liabilities: number | null
          total_current_liabilities_eur: number | null
          total_current_liabilities_orig: number | null
          total_current_liabilities_usd: number | null
          total_debt: number | null
          total_debt_eur: number | null
          total_debt_orig: number | null
          total_debt_usd: number | null
          total_other_income_expenses_net_eur: number | null
          total_other_income_expenses_net_orig: number | null
          total_other_income_expenses_net_usd: number | null
          total_stockholders_equity: number | null
          total_stockholders_equity_eur: number | null
          total_stockholders_equity_orig: number | null
          total_stockholders_equity_usd: number | null
          weighted_avg_shares_dil: number | null
        }
        Insert: {
          beta?: number | null
          capital_expenditure?: number | null
          capital_expenditure_eur?: number | null
          capital_expenditure_orig?: number | null
          capital_expenditure_usd?: number | null
          cash_and_equivalents?: number | null
          cash_and_equivalents_eur?: number | null
          cash_and_equivalents_orig?: number | null
          cash_and_equivalents_usd?: number | null
          date: string
          dividends_paid?: number | null
          dividends_paid_eur?: number | null
          dividends_paid_orig?: number | null
          dividends_paid_usd?: number | null
          ebit?: number | null
          ebit_eur?: number | null
          ebit_orig?: number | null
          ebit_usd?: number | null
          ebitda?: number | null
          ebitda_eur?: number | null
          ebitda_orig?: number | null
          ebitda_usd?: number | null
          eps_diluted?: number | null
          eps_diluted_eur?: number | null
          eps_diluted_orig?: number | null
          eps_diluted_usd?: number | null
          free_cash_flow?: number | null
          free_cash_flow_eur?: number | null
          free_cash_flow_orig?: number | null
          free_cash_flow_usd?: number | null
          id?: number
          income_before_tax?: number | null
          income_before_tax_eur?: number | null
          income_before_tax_orig?: number | null
          income_before_tax_usd?: number | null
          income_tax_expense?: number | null
          income_tax_expense_eur?: number | null
          income_tax_expense_orig?: number | null
          income_tax_expense_usd?: number | null
          interest_expense?: number | null
          interest_expense_eur?: number | null
          interest_expense_orig?: number | null
          interest_expense_usd?: number | null
          market_cap?: number | null
          name?: string | null
          net_income?: number | null
          net_income_eur?: number | null
          net_income_orig?: number | null
          net_income_usd?: number | null
          operating_cash_flow?: number | null
          operating_cash_flow_eur?: number | null
          operating_cash_flow_orig?: number | null
          operating_cash_flow_usd?: number | null
          other_adjustments_net_income?: number | null
          other_adjustments_net_income_eur?: number | null
          other_adjustments_net_income_orig?: number | null
          other_adjustments_net_income_usd?: number | null
          period: string
          reported_currency?: string | null
          research_and_development_expenses_eur?: number | null
          research_and_development_expenses_orig?: number | null
          research_and_development_expenses_usd?: number | null
          revenue?: number | null
          revenue_eur?: number | null
          revenue_orig?: number | null
          revenue_usd?: number | null
          stock_id?: number | null
          symbol?: string | null
          total_assets?: number | null
          total_assets_eur?: number | null
          total_assets_orig?: number | null
          total_assets_usd?: number | null
          total_current_assets?: number | null
          total_current_assets_eur?: number | null
          total_current_assets_orig?: number | null
          total_current_assets_usd?: number | null
          total_current_liabilities?: number | null
          total_current_liabilities_eur?: number | null
          total_current_liabilities_orig?: number | null
          total_current_liabilities_usd?: number | null
          total_debt?: number | null
          total_debt_eur?: number | null
          total_debt_orig?: number | null
          total_debt_usd?: number | null
          total_other_income_expenses_net_eur?: number | null
          total_other_income_expenses_net_orig?: number | null
          total_other_income_expenses_net_usd?: number | null
          total_stockholders_equity?: number | null
          total_stockholders_equity_eur?: number | null
          total_stockholders_equity_orig?: number | null
          total_stockholders_equity_usd?: number | null
          weighted_avg_shares_dil?: number | null
        }
        Update: {
          beta?: number | null
          capital_expenditure?: number | null
          capital_expenditure_eur?: number | null
          capital_expenditure_orig?: number | null
          capital_expenditure_usd?: number | null
          cash_and_equivalents?: number | null
          cash_and_equivalents_eur?: number | null
          cash_and_equivalents_orig?: number | null
          cash_and_equivalents_usd?: number | null
          date?: string
          dividends_paid?: number | null
          dividends_paid_eur?: number | null
          dividends_paid_orig?: number | null
          dividends_paid_usd?: number | null
          ebit?: number | null
          ebit_eur?: number | null
          ebit_orig?: number | null
          ebit_usd?: number | null
          ebitda?: number | null
          ebitda_eur?: number | null
          ebitda_orig?: number | null
          ebitda_usd?: number | null
          eps_diluted?: number | null
          eps_diluted_eur?: number | null
          eps_diluted_orig?: number | null
          eps_diluted_usd?: number | null
          free_cash_flow?: number | null
          free_cash_flow_eur?: number | null
          free_cash_flow_orig?: number | null
          free_cash_flow_usd?: number | null
          id?: number
          income_before_tax?: number | null
          income_before_tax_eur?: number | null
          income_before_tax_orig?: number | null
          income_before_tax_usd?: number | null
          income_tax_expense?: number | null
          income_tax_expense_eur?: number | null
          income_tax_expense_orig?: number | null
          income_tax_expense_usd?: number | null
          interest_expense?: number | null
          interest_expense_eur?: number | null
          interest_expense_orig?: number | null
          interest_expense_usd?: number | null
          market_cap?: number | null
          name?: string | null
          net_income?: number | null
          net_income_eur?: number | null
          net_income_orig?: number | null
          net_income_usd?: number | null
          operating_cash_flow?: number | null
          operating_cash_flow_eur?: number | null
          operating_cash_flow_orig?: number | null
          operating_cash_flow_usd?: number | null
          other_adjustments_net_income?: number | null
          other_adjustments_net_income_eur?: number | null
          other_adjustments_net_income_orig?: number | null
          other_adjustments_net_income_usd?: number | null
          period?: string
          reported_currency?: string | null
          research_and_development_expenses_eur?: number | null
          research_and_development_expenses_orig?: number | null
          research_and_development_expenses_usd?: number | null
          revenue?: number | null
          revenue_eur?: number | null
          revenue_orig?: number | null
          revenue_usd?: number | null
          stock_id?: number | null
          symbol?: string | null
          total_assets?: number | null
          total_assets_eur?: number | null
          total_assets_orig?: number | null
          total_assets_usd?: number | null
          total_current_assets?: number | null
          total_current_assets_eur?: number | null
          total_current_assets_orig?: number | null
          total_current_assets_usd?: number | null
          total_current_liabilities?: number | null
          total_current_liabilities_eur?: number | null
          total_current_liabilities_orig?: number | null
          total_current_liabilities_usd?: number | null
          total_debt?: number | null
          total_debt_eur?: number | null
          total_debt_orig?: number | null
          total_debt_usd?: number | null
          total_other_income_expenses_net_eur?: number | null
          total_other_income_expenses_net_orig?: number | null
          total_other_income_expenses_net_usd?: number | null
          total_stockholders_equity?: number | null
          total_stockholders_equity_eur?: number | null
          total_stockholders_equity_orig?: number | null
          total_stockholders_equity_usd?: number | null
          weighted_avg_shares_dil?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_statements_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_averages: {
        Row: {
          calculation_date: string
          id: number
          industry: string
          metric_type: string
          value: number | null
        }
        Insert: {
          calculation_date: string
          id?: number
          industry: string
          metric_type: string
          value?: number | null
        }
        Update: {
          calculation_date?: string
          id?: number
          industry?: string
          metric_type?: string
          value?: number | null
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
      market_risk_premiums: {
        Row: {
          country: string
          created_at: string
          id: string
          total_equity_risk_premium: number
          updated_at: string
          valid_date: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          total_equity_risk_premium: number
          updated_at?: string
          valid_date?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          total_equity_risk_premium?: number
          updated_at?: string
          valid_date?: string
        }
        Relationships: []
      }
      precomputed_metrics: {
        Row: {
          calculation_date: string
          id: number
          last_updated: string | null
          metric_type: string
          stock_id: number | null
          value: number | null
        }
        Insert: {
          calculation_date: string
          id?: number
          last_updated?: string | null
          metric_type: string
          stock_id?: number | null
          value?: number | null
        }
        Update: {
          calculation_date?: string
          id?: number
          last_updated?: string | null
          metric_type?: string
          stock_id?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precomputed_metrics_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
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
      risk_free_rates: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          data_source: string
          id: string
          rate: number
          updated_at: string
          valid_date: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          data_source: string
          id?: string
          rate: number
          updated_at?: string
          valid_date: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          data_source?: string
          id?: string
          rate?: number
          updated_at?: string
          valid_date?: string
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
      stocks: {
        Row: {
          address: string | null
          ceo: string | null
          city: string | null
          country: string | null
          currency: string | null
          description: string | null
          exchange: string | null
          full_time_employees: number | null
          id: number
          image: string | null
          industry: string | null
          industry_de: string | null
          ipo_date: string | null
          is_actively_trading: boolean | null
          is_adr: boolean | null
          is_etf: boolean | null
          is_fund: boolean | null
          isin: string | null
          last_dividend: number | null
          last_updated: string | null
          market_cap: number | null
          name: string | null
          phone: string | null
          price: number | null
          sector: string | null
          sector_de: string | null
          state: string | null
          symbol: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          ceo?: string | null
          city?: string | null
          country?: string | null
          currency?: string | null
          description?: string | null
          exchange?: string | null
          full_time_employees?: number | null
          id?: number
          image?: string | null
          industry?: string | null
          industry_de?: string | null
          ipo_date?: string | null
          is_actively_trading?: boolean | null
          is_adr?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          isin?: string | null
          last_dividend?: number | null
          last_updated?: string | null
          market_cap?: number | null
          name?: string | null
          phone?: string | null
          price?: number | null
          sector?: string | null
          sector_de?: string | null
          state?: string | null
          symbol: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          ceo?: string | null
          city?: string | null
          country?: string | null
          currency?: string | null
          description?: string | null
          exchange?: string | null
          full_time_employees?: number | null
          id?: number
          image?: string | null
          industry?: string | null
          industry_de?: string | null
          ipo_date?: string | null
          is_actively_trading?: boolean | null
          is_adr?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          isin?: string | null
          last_dividend?: number | null
          last_updated?: string | null
          market_cap?: number | null
          name?: string | null
          phone?: string | null
          price?: number | null
          sector?: string | null
          sector_de?: string | null
          state?: string | null
          symbol?: string
          website?: string | null
          zip?: string | null
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

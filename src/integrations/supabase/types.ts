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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          metadata: Json | null
          profile_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          profile_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challan_items: {
        Row: {
          challan_id: string
          created_at: string
          description: string
          id: string
          product_id: string | null
          qty: number
          sort_order: number
        }
        Insert: {
          challan_id: string
          created_at?: string
          description: string
          id?: string
          product_id?: string | null
          qty?: number
          sort_order?: number
        }
        Update: {
          challan_id?: string
          created_at?: string
          description?: string
          id?: string
          product_id?: string | null
          qty?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "challan_items_challan_id_fkey"
            columns: ["challan_id"]
            isOneToOne: false
            referencedRelation: "delivery_challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challan_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_address: string | null
          created_at: string
          credit_balance: number
          email: string | null
          gstin: string | null
          id: string
          name: string
          phone: string | null
          profile_id: string
          state_code: string
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          phone?: string | null
          profile_id: string
          state_code?: string
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          credit_balance?: number
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string
          state_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_challans: {
        Row: {
          challan_number: string
          client_id: string | null
          created_at: string
          date_issued: string
          dispatch_from: string | null
          dispatch_to: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          profile_id: string
          status: string
          transport_mode: string | null
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          challan_number: string
          client_id?: string | null
          created_at?: string
          date_issued?: string
          dispatch_from?: string | null
          dispatch_to?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          profile_id: string
          status?: string
          transport_mode?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          challan_number?: string
          client_id?: string | null
          created_at?: string
          date_issued?: string
          dispatch_from?: string | null
          dispatch_to?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          profile_id?: string
          status?: string
          transport_mode?: string | null
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_challans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_challans_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          change_amount: number
          created_at: string
          id: string
          product_id: string
          reason: string
          reference_id: string | null
        }
        Insert: {
          change_amount: number
          created_at?: string
          id?: string
          product_id: string
          reason: string
          reference_id?: string | null
        }
        Update: {
          change_amount?: number
          created_at?: string
          id?: string
          product_id?: string
          reason?: string
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          discount: number
          id: string
          invoice_id: string
          product_id: string | null
          qty: number
          rate: number
          sort_order: number
          tax_rate: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          discount?: number
          id?: string
          invoice_id: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          discount?: number
          id?: string
          invoice_id?: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string
          date_due: string | null
          date_issued: string
          e_invoice_status: string | null
          grand_total: number
          id: string
          invoice_number: string
          irn_date: string | null
          irn_number: string | null
          notes: string | null
          payment_date: string | null
          payment_mode: string | null
          profile_id: string
          share_token: string | null
          status: string
          subtotal: number
          total_discount: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_due?: string | null
          date_issued?: string
          e_invoice_status?: string | null
          grand_total?: number
          id?: string
          invoice_number: string
          irn_date?: string | null
          irn_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          profile_id: string
          share_token?: string | null
          status?: string
          subtotal?: number
          total_discount?: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_due?: string | null
          date_issued?: string
          e_invoice_status?: string | null
          grand_total?: number
          id?: string
          invoice_number?: string
          irn_date?: string | null
          irn_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_mode?: string | null
          profile_id?: string
          share_token?: string | null
          status?: string
          subtotal?: number
          total_discount?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          profile_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          profile_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          profile_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      po_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          po_id: string
          product_id: string | null
          qty: number
          rate: number
          sort_order: number
          tax_rate: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          po_id: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          po_id?: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string | null
          id: string
          product_id: string
          profile_id: string
          purchase_bill_id: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id: string
          profile_id: string
          purchase_bill_id?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          product_id?: string
          profile_id?: string
          purchase_bill_id?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_purchase_bill_id_fkey"
            columns: ["purchase_bill_id"]
            isOneToOne: false
            referencedRelation: "purchase_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          created_at: string
          default_supplier_gstin: string | null
          default_supplier_name: string | null
          description: string | null
          hsn_code: string | null
          id: string
          low_stock_limit: number
          name: string
          profile_id: string
          selling_price: number
          sku: string
          stock_quantity: number
          tax_rate: number
          type: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          created_at?: string
          default_supplier_gstin?: string | null
          default_supplier_name?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          low_stock_limit?: number
          name: string
          profile_id: string
          selling_price?: number
          sku: string
          stock_quantity?: number
          tax_rate?: number
          type?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          created_at?: string
          default_supplier_gstin?: string | null
          default_supplier_name?: string | null
          description?: string | null
          hsn_code?: string | null
          id?: string
          low_stock_limit?: number
          name?: string
          profile_id?: string
          selling_price?: number
          sku?: string
          stock_quantity?: number
          tax_rate?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          business_type: string | null
          created_at: string
          email: string | null
          enabled_modules: string[]
          expiry_alert_days: number
          gstin: string | null
          id: string
          invoice_prefix: string
          logo_url: string | null
          next_challan_number: number
          next_invoice_number: number
          next_po_number: number
          next_quotation_number: number
          onboarding_completed: boolean
          org_name: string
          pan_number: string | null
          phone: string | null
          quotation_prefix: string
          state_code: string
          updated_at: string
          upi_vpa: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          business_type?: string | null
          created_at?: string
          email?: string | null
          enabled_modules?: string[]
          expiry_alert_days?: number
          gstin?: string | null
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          next_challan_number?: number
          next_invoice_number?: number
          next_po_number?: number
          next_quotation_number?: number
          onboarding_completed?: boolean
          org_name: string
          pan_number?: string | null
          phone?: string | null
          quotation_prefix?: string
          state_code?: string
          updated_at?: string
          upi_vpa?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          business_type?: string | null
          created_at?: string
          email?: string | null
          enabled_modules?: string[]
          expiry_alert_days?: number
          gstin?: string | null
          id?: string
          invoice_prefix?: string
          logo_url?: string | null
          next_challan_number?: number
          next_invoice_number?: number
          next_po_number?: number
          next_quotation_number?: number
          onboarding_completed?: boolean
          org_name?: string
          pan_number?: string | null
          phone?: string | null
          quotation_prefix?: string
          state_code?: string
          updated_at?: string
          upi_vpa?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_bill_items: {
        Row: {
          amount: number
          batch_number: string | null
          bill_id: string
          created_at: string
          description: string
          expiry_date: string | null
          id: string
          product_id: string | null
          qty: number
          rate: number
          sort_order: number
          tax_rate: number
        }
        Insert: {
          amount?: number
          batch_number?: string | null
          bill_id: string
          created_at?: string
          description: string
          expiry_date?: string | null
          id?: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          batch_number?: string | null
          bill_id?: string
          created_at?: string
          description?: string
          expiry_date?: string | null
          id?: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "purchase_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_bill_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_bills: {
        Row: {
          bill_date: string
          bill_number: string
          created_at: string
          grand_total: number
          id: string
          notes: string | null
          profile_id: string
          received_date: string | null
          status: string
          subtotal: number
          supplier_address: string | null
          supplier_gstin: string | null
          supplier_name: string
          total_tax: number
          updated_at: string
        }
        Insert: {
          bill_date?: string
          bill_number: string
          created_at?: string
          grand_total?: number
          id?: string
          notes?: string | null
          profile_id: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_address?: string | null
          supplier_gstin?: string | null
          supplier_name: string
          total_tax?: number
          updated_at?: string
        }
        Update: {
          bill_date?: string
          bill_number?: string
          created_at?: string
          grand_total?: number
          id?: string
          notes?: string | null
          profile_id?: string
          received_date?: string | null
          status?: string
          subtotal?: number
          supplier_address?: string | null
          supplier_gstin?: string | null
          supplier_name?: string
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_bills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          date_issued: string
          expected_delivery: string | null
          grand_total: number
          id: string
          notes: string | null
          po_number: string
          profile_id: string
          status: string
          subtotal: number
          supplier_address: string | null
          supplier_gstin: string | null
          supplier_name: string
          total_tax: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_issued?: string
          expected_delivery?: string | null
          grand_total?: number
          id?: string
          notes?: string | null
          po_number: string
          profile_id: string
          status?: string
          subtotal?: number
          supplier_address?: string | null
          supplier_gstin?: string | null
          supplier_name: string
          total_tax?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_issued?: string
          expected_delivery?: string | null
          grand_total?: number
          id?: string
          notes?: string | null
          po_number?: string
          profile_id?: string
          status?: string
          subtotal?: number
          supplier_address?: string | null
          supplier_gstin?: string | null
          supplier_name?: string
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          discount: number
          id: string
          product_id: string | null
          qty: number
          quotation_id: string
          rate: number
          sort_order: number
          tax_rate: number
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          discount?: number
          id?: string
          product_id?: string | null
          qty?: number
          quotation_id: string
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          discount?: number
          id?: string
          product_id?: string | null
          qty?: number
          quotation_id?: string
          rate?: number
          sort_order?: number
          tax_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          client_id: string | null
          converted_invoice_id: string | null
          created_at: string
          date_issued: string
          grand_total: number
          id: string
          notes: string | null
          profile_id: string
          quotation_number: string
          status: string
          subtotal: number
          terms: string | null
          total_discount: number
          total_tax: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          date_issued?: string
          grand_total?: number
          id?: string
          notes?: string | null
          profile_id: string
          quotation_number: string
          status?: string
          subtotal?: number
          terms?: string | null
          total_discount?: number
          total_tax?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          date_issued?: string
          grand_total?: number
          id?: string
          notes?: string | null
          profile_id?: string
          quotation_number?: string
          status?: string
          subtotal?: number
          terms?: string | null
          total_discount?: number
          total_tax?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_converted_invoice_id_fkey"
            columns: ["converted_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_template_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          discount: number
          id: string
          product_id: string | null
          qty: number
          rate: number
          sort_order: number
          tax_rate: number
          template_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          discount?: number
          id?: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
          template_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          discount?: number
          id?: string
          product_id?: string | null
          qty?: number
          rate?: number
          sort_order?: number
          tax_rate?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_template_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recurring_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_templates: {
        Row: {
          client_id: string
          created_at: string
          frequency: string
          grand_total: number
          id: string
          is_active: boolean
          next_generate_date: string
          notes: string | null
          profile_id: string
          subtotal: number
          template_name: string
          total_tax: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          frequency?: string
          grand_total?: number
          id?: string
          is_active?: boolean
          next_generate_date: string
          notes?: string | null
          profile_id: string
          subtotal?: number
          template_name: string
          total_tax?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          frequency?: string
          grand_total?: number
          id?: string
          is_active?: boolean
          next_generate_date?: string
          notes?: string | null
          profile_id?: string
          subtotal?: number
          template_name?: string
          total_tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_templates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tds_entries: {
        Row: {
          certificate_number: string | null
          client_id: string | null
          created_at: string
          date_deducted: string
          financial_year: string
          gross_amount: number
          id: string
          invoice_id: string | null
          notes: string | null
          profile_id: string
          quarter: string
          status: string
          tds_amount: number
          tds_rate: number
          tds_section: string
          updated_at: string
        }
        Insert: {
          certificate_number?: string | null
          client_id?: string | null
          created_at?: string
          date_deducted?: string
          financial_year: string
          gross_amount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          profile_id: string
          quarter: string
          status?: string
          tds_amount?: number
          tds_rate?: number
          tds_section?: string
          updated_at?: string
        }
        Update: {
          certificate_number?: string | null
          client_id?: string | null
          created_at?: string
          date_deducted?: string
          financial_year?: string
          gross_amount?: number
          id?: string
          invoice_id?: string | null
          notes?: string | null
          profile_id?: string
          quarter?: string
          status?: string
          tds_amount?: number
          tds_rate?: number
          tds_section?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tds_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tds_entries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tds_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      finalize_invoice: { Args: { p_invoice_id: string }; Returns: boolean }
      finalize_purchase_bill: { Args: { p_bill_id: string }; Returns: boolean }
      generate_invoice_number: {
        Args: { p_profile_id: string }
        Returns: string
      }
      generate_share_token: { Args: never; Returns: string }
      get_user_profile_id: { Args: never; Returns: string }
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
    },
  },
} as const

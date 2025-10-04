import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          base_price: number;
          category: string;
          popular: boolean;
          available: boolean;
          image_url: string | null;
          discount_price: number | null;
          discount_start_date: string | null;
          discount_end_date: string | null;
          discount_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          base_price: number;
          category: string;
          popular?: boolean;
          available?: boolean;
          image_url?: string | null;
          discount_price?: number | null;
          discount_start_date?: string | null;
          discount_end_date?: string | null;
          discount_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          base_price?: number;
          category?: string;
          popular?: boolean;
          available?: boolean;
          image_url?: string | null;
          discount_price?: number | null;
          discount_start_date?: string | null;
          discount_end_date?: string | null;
          discount_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      variations: {
        Row: {
          id: string;
          menu_item_id: string;
          name: string;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          name: string;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          name?: string;
          price?: number;
          created_at?: string;
        };
      };
      add_ons: {
        Row: {
          id: string;
          menu_item_id: string;
          name: string;
          price: number;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          name: string;
          price: number;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          menu_item_id?: string;
          name?: string;
          price?: number;
          category?: string;
          created_at?: string;
        };
      };
      payment_methods: {
        Row: {
          id: string;
          name: string;
          account_number: string;
          account_name: string;
          qr_code_url: string;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          account_number: string;
          account_name: string;
          qr_code_url: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          account_number?: string;
          account_name?: string;
          qr_code_url?: string;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          value: string;
          type: string;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          value: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          type?: string;
          description?: string | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_code: string;
          customer_name: string;
          contact_number: string;
          service_type: string;
          table_number: string | null;
          address: string | null;
          landmark: string | null;
          pickup_time: string | null;
          notes: string | null;
          payment_method: string;
          total: number;
          status: string;
          line_items: unknown;
          messenger_payload: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_code?: string;
          customer_name: string;
          contact_number: string;
          service_type: string;
          table_number?: string | null;
          address?: string | null;
          landmark?: string | null;
          pickup_time?: string | null;
          notes?: string | null;
          payment_method: string;
          total: number;
          status?: string;
          line_items: unknown;
          messenger_payload?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_code?: string;
          customer_name?: string;
          contact_number?: string;
          service_type?: string;
          table_number?: string | null;
          address?: string | null;
          landmark?: string | null;
          pickup_time?: string | null;
          notes?: string | null;
          payment_method?: string;
          total?: number;
          status?: string;
          line_items?: unknown;
          messenger_payload?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          display_name: string;
          role: 'owner' | 'manager' | 'staff';
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          display_name: string;
          role?: 'owner' | 'manager' | 'staff';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          display_name?: string;
          role?: 'owner' | 'manager' | 'staff';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_permissions: {
        Row: {
          staff_id: string;
          component: 'dashboard' | 'items' | 'orders' | 'categories' | 'payments' | 'settings' | 'staff';
          can_view: boolean;
          can_manage: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          staff_id: string;
          component: 'dashboard' | 'items' | 'orders' | 'categories' | 'payments' | 'settings' | 'staff';
          can_view?: boolean;
          can_manage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          staff_id?: string;
          component?: 'dashboard' | 'items' | 'orders' | 'categories' | 'payments' | 'settings' | 'staff';
          can_view?: boolean;
          can_manage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

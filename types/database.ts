export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: TimestampColumns & {
          id: string;
          name: string;
          type: "income" | "expense";
          payment_method: "cash" | "non_cash";
          color: string;
          icon: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: "income" | "expense";
          payment_method?: "cash" | "non_cash";
          color?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "income" | "expense";
          payment_method?: "cash" | "non_cash";
          color?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: TimestampColumns & {
          id: string;
          name: string;
          type: string;
          initial_balance: number;
          color: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          initial_balance?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          initial_balance?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: TimestampColumns & {
          id: string;
          type: "income" | "expense";
          amount: number;
          description: string;
          transaction_date: string;
          notes: string | null;
          attachment_path: string | null;
          attachment_name: string | null;
          attachment_type: string | null;
          attachment_size: number | null;
          category_id: string;
          wallet_id: string;
        };
        Insert: {
          id?: string;
          type: "income" | "expense";
          amount: number;
          description: string;
          transaction_date?: string;
          notes?: string | null;
          attachment_path?: string | null;
          attachment_name?: string | null;
          attachment_type?: string | null;
          attachment_size?: number | null;
          category_id: string;
          wallet_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: "income" | "expense";
          amount?: number;
          description?: string;
          transaction_date?: string;
          notes?: string | null;
          attachment_path?: string | null;
          attachment_name?: string | null;
          attachment_type?: string | null;
          attachment_size?: number | null;
          category_id?: string;
          wallet_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_wallet_id_fkey";
            columns: ["wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: TimestampColumns & {
          id: string;
          category_id: string;
          month: string;
          amount: number;
        };
        Insert: {
          id?: string;
          category_id: string;
          month: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          month?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      wallet_transfers: {
        Row: TimestampColumns & {
          id: string;
          from_wallet_id: string;
          to_wallet_id: string;
          amount: number;
          fee: number;
          transfer_date: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          from_wallet_id: string;
          to_wallet_id: string;
          amount: number;
          fee?: number;
          transfer_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_wallet_id?: string;
          to_wallet_id?: string;
          amount?: number;
          fee?: number;
          transfer_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wallet_transfers_from_wallet_id_fkey";
            columns: ["from_wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wallet_transfers_to_wallet_id_fkey";
            columns: ["to_wallet_id"];
            isOneToOne: false;
            referencedRelation: "wallets";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_reminders: {
        Row: TimestampColumns & {
          id: string;
          title: string;
          due_date: string;
          amount: number | null;
          notes: string | null;
          status: "pending" | "paid";
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          due_date: string;
          amount?: number | null;
          notes?: string | null;
          status?: "pending" | "paid";
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          due_date?: string;
          amount?: number | null;
          notes?: string | null;
          status?: "pending" | "paid";
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      restore_finance_backup: {
        Args: { payload: Json };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

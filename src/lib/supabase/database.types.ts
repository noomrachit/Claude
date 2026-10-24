// Generated from supabase/migrations (postgres-meta typescript generator). Regenerate with: npm run gen:types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          board_id: string
          card_id: string
          created_at: string
          file_name: string
          id: string
          mime_type: string | null
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
        }
        ComputedFields: never
        Insert: {
          board_id: string
          card_id: string
          created_at?: string
          file_name: string
          id?: string
          mime_type?: string | null
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          board_id?: string
          card_id?: string
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_card_id_board_id_fkey"
            columns: ["card_id", "board_id"]
            referencedRelation: "cards"
            referencedColumns: ["id", "board_id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_invitations: {
        Row: {
          board_id: string
          created_at: string
          email: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["board_role"]
        }
        ComputedFields: never
        Insert: {
          board_id: string
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["board_role"]
        }
        Update: {
          board_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["board_role"]
        }
        Relationships: [
          {
            foreignKeyName: "board_invitations_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_invitations_invited_by_fkey"
            columns: ["invited_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          board_id: string
          created_at: string
          role: Database["public"]["Enums"]["board_role"]
          user_id: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          created_at?: string
          role?: Database["public"]["Enums"]["board_role"]
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["board_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_assignees: {
        Row: {
          board_id: string
          card_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          card_id: string
          user_id: string
        }
        Update: {
          board_id?: string
          card_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_assignees_board_id_user_id_fkey"
            columns: ["board_id", "user_id"]
            referencedRelation: "board_members"
            referencedColumns: ["board_id", "user_id"]
          },
          {
            foreignKeyName: "card_assignees_card_id_board_id_fkey"
            columns: ["card_id", "board_id"]
            referencedRelation: "cards"
            referencedColumns: ["id", "board_id"]
          },
        ]
      }
      card_labels: {
        Row: {
          board_id: string
          card_id: string
          label_id: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          card_id: string
          label_id: string
        }
        Update: {
          board_id?: string
          card_id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_labels_card_id_board_id_fkey"
            columns: ["card_id", "board_id"]
            referencedRelation: "cards"
            referencedColumns: ["id", "board_id"]
          },
          {
            foreignKeyName: "card_labels_label_id_board_id_fkey"
            columns: ["label_id", "board_id"]
            referencedRelation: "labels"
            referencedColumns: ["id", "board_id"]
          },
        ]
      }
      cards: {
        Row: {
          archived_at: string | null
          board_id: string
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          list_id: string
          position: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          board_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          list_id: string
          position: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          board_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          list_id?: string
          position?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_list_id_board_id_fkey"
            columns: ["list_id", "board_id"]
            referencedRelation: "lists"
            referencedColumns: ["id", "board_id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          board_id: string
          card_id: string
          content: string
          created_at: string
          done: boolean
          id: string
          position: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          card_id: string
          content: string
          created_at?: string
          done?: boolean
          id?: string
          position: string
          updated_at?: string
        }
        Update: {
          board_id?: string
          card_id?: string
          content?: string
          created_at?: string
          done?: boolean
          id?: string
          position?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_card_id_board_id_fkey"
            columns: ["card_id", "board_id"]
            referencedRelation: "cards"
            referencedColumns: ["id", "board_id"]
          },
        ]
      }
      comments: {
        Row: {
          board_id: string
          body: string
          card_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          body: string
          card_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          board_id?: string
          body?: string
          card_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_card_id_board_id_fkey"
            columns: ["card_id", "board_id"]
            referencedRelation: "cards"
            referencedColumns: ["id", "board_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          board_id: string
          color: string
          created_at: string
          id: string
          name: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          color: string
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          board_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          board_id: string
          created_at: string
          id: string
          position: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          position: string
          title: string
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          position?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_board_id_fkey"
            columns: ["board_id"]
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      invite_to_board: {
        Args: {
          p_board_id: string
          p_email: string
          p_role?: Database["public"]["Enums"]["board_role"]
        }
        Returns: string
      }
    }
    Enums: {
      board_role: "owner" | "editor" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      board_role: ["owner", "editor", "viewer"],
    },
  },
} as const

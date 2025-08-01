export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at: string | null
          id: string
          notes: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          specialist_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_email: string
          patient_name: string
          patient_phone: string
          specialist_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          appointment_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          patient_email?: string
          patient_name?: string
          patient_phone?: string
          specialist_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      automatic_orders: {
        Row: {
          amount: number
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string
          id: string
          is_active: boolean | null
          monthly_payment_day: number
          package_name: string
          package_type: string
          paid_months: number[] | null
          payment_method: string
          registration_date: string
          total_months: number
          updated_at: string
        }
        Insert: {
          amount: number
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string
          id?: string
          is_active?: boolean | null
          monthly_payment_day: number
          package_name: string
          package_type: string
          paid_months?: number[] | null
          payment_method: string
          registration_date: string
          total_months?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string
          id?: string
          is_active?: boolean | null
          monthly_payment_day?: number
          package_name?: string
          package_type?: string
          paid_months?: number[] | null
          payment_method?: string
          registration_date?: string
          total_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string | null
          id: string
          post_id: string | null
        }
        Insert: {
          category_id?: string | null
          id?: string
          post_id?: string | null
        }
        Update: {
          category_id?: string | null
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string
          author_type: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name: string
          author_type?: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string
          author_type?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      client_referrals: {
        Row: {
          created_at: string
          id: string
          is_referred: boolean
          month: number
          notes: string | null
          referral_count: number
          referred_at: string | null
          referred_by: string | null
          specialist_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_referred?: boolean
          month: number
          notes?: string | null
          referral_count?: number
          referred_at?: string | null
          referred_by?: string | null
          specialist_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          is_referred?: boolean
          month?: number
          notes?: string | null
          referral_count?: number
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_referrals_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salaries: {
        Row: {
          base_salary: number
          bonus: number | null
          created_at: string
          created_by: string | null
          deductions: number | null
          employee_name: string
          employee_surname: string
          id: string
          notes: string | null
          payment_date: string | null
          salary_month: number
          salary_year: number
          status: string
          total_salary: number | null
          updated_at: string
        }
        Insert: {
          base_salary: number
          bonus?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_name: string
          employee_surname: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          salary_month: number
          salary_year: number
          status?: string
          total_salary?: number | null
          updated_at?: string
        }
        Update: {
          base_salary?: number
          bonus?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_name?: string
          employee_surname?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          salary_month?: number
          salary_year?: number
          status?: string
          total_salary?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      form_contents: {
        Row: {
          content: string
          created_at: string
          form_type: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          form_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          form_type?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      iyzico_settings: {
        Row: {
          api_key: string
          created_at: string
          description: string | null
          id: string
          sandbox_mode: boolean | null
          secret_key: string
          subscription_reference_code: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          description?: string | null
          id?: string
          sandbox_mode?: boolean | null
          secret_key: string
          subscription_reference_code?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          description?: string | null
          id?: string
          sandbox_mode?: boolean | null
          secret_key?: string
          subscription_reference_code?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      legal_proceedings: {
        Row: {
          created_at: string
          created_by: string | null
          customer_name: string
          id: string
          is_paid: boolean
          notes: string | null
          proceeding_amount: number
          status: string
          total_months: number
          unpaid_months: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_name: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          proceeding_amount: number
          status: string
          total_months: number
          unpaid_months: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_name?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          proceeding_amount?: number
          status?: string
          total_months?: number
          unpaid_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string
          customer_address: string | null
          customer_city: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string
          is_first_order: boolean | null
          package_name: string
          package_type: string
          parent_order_id: string | null
          payment_method: string
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string
          subscription_month: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string
          is_first_order?: boolean | null
          package_name: string
          package_type: string
          parent_order_id?: string | null
          payment_method: string
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string
          subscription_month?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string
          is_first_order?: boolean | null
          package_name?: string
          package_type?: string
          parent_order_id?: string | null
          payment_method?: string
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string
          subscription_month?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_parent_order_id_fkey"
            columns: ["parent_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          color: string
          created_at: string
          features: string[]
          icon: string
          id: string
          is_active: boolean | null
          link: string | null
          name: string
          original_price: number
          package_key: string
          popular: boolean | null
          price: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          features?: string[]
          icon?: string
          id?: string
          is_active?: boolean | null
          link?: string | null
          name: string
          original_price: number
          package_key: string
          popular?: boolean | null
          price: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          features?: string[]
          icon?: string
          id?: string
          is_active?: boolean | null
          link?: string | null
          name?: string
          original_price?: number
          package_key?: string
          popular?: boolean | null
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          specialist_id: string
          status: string
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          specialist_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          reviewer_email?: string
          reviewer_name?: string
          specialist_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_tests: {
        Row: {
          created_at: string | null
          custom_message: string | null
          id: string
          is_enabled: boolean | null
          specialist_id: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          is_enabled?: boolean | null
          specialist_id?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_message?: string | null
          id?: string
          is_enabled?: boolean | null
          specialist_id?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialist_tests_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          bio: string | null
          certifications: string | null
          city: string
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string
          internal_number: string | null
          is_active: boolean | null
          name: string
          online_consultation: boolean | null
          package_price: number | null
          payment_day: number | null
          phone: string | null
          profile_picture: string | null
          rating: number | null
          reviews_count: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          specialty: string
          university: string | null
          updated_at: string
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          bio?: string | null
          certifications?: string | null
          city?: string
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string
          internal_number?: string | null
          is_active?: boolean | null
          name: string
          online_consultation?: boolean | null
          package_price?: number | null
          payment_day?: number | null
          phone?: string | null
          profile_picture?: string | null
          rating?: number | null
          reviews_count?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          specialty: string
          university?: string | null
          updated_at?: string
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          bio?: string | null
          certifications?: string | null
          city?: string
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string
          internal_number?: string | null
          is_active?: boolean | null
          name?: string
          online_consultation?: boolean | null
          package_price?: number | null
          payment_day?: number | null
          phone?: string | null
          profile_picture?: string | null
          rating?: number | null
          reviews_count?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          specialty?: string
          university?: string | null
          updated_at?: string
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      success_statistics: {
        Row: {
          created_at: string
          created_by: string | null
          day: number
          employee_name: string
          employee_surname: string
          id: string
          month: number
          specialists_registered: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day?: number
          employee_name: string
          employee_surname: string
          id?: string
          month: number
          specialists_registered?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day?: number
          employee_name?: string
          employee_surname?: string
          id?: string
          month?: number
          specialists_registered?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          specialist_email: string
          specialist_id: string
          specialist_name: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          specialist_email: string
          specialist_id: string
          specialist_name: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          specialist_email?: string
          specialist_id?: string
          specialist_name?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      test_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          options: Json | null
          question_text: string
          question_type: string
          step_number: number
          test_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question_text: string
          question_type?: string
          step_number?: number
          test_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          question_text?: string
          question_type?: string
          step_number?: number
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          answers: Json
          created_at: string
          id: string
          patient_email: string
          patient_name: string
          results: Json
          specialist_id: string
          specialty_area: string | null
          status: string
          test_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          patient_email: string
          patient_name: string
          results?: Json
          specialist_id: string
          specialty_area?: string | null
          status?: string
          test_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          patient_email?: string
          patient_name?: string
          results?: Json
          specialist_id?: string
          specialty_area?: string | null
          status?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_approved: boolean
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_approved?: boolean
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_approved?: boolean
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
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
      can_manage_users: {
        Args: { target_user_id?: string }
        Returns: boolean
      }
      create_specialist_profile: {
        Args: { p_specialist_id: string; p_user_id: string }
        Returns: undefined
      }
      generate_monthly_orders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_approved: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "specialist" | "user" | "staff" | "legal"
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
      user_role: ["admin", "specialist", "user", "staff", "legal"],
    },
  },
} as const

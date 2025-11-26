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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          appointment_type: string
          created_at: string | null
          created_by_specialist: boolean | null
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
          created_by_specialist?: boolean | null
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
          created_by_specialist?: boolean | null
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
      backup_1761821258_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1761821258_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1761821258_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1761821258_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761821258_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1761840000_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1761840000_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1761840000_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1761840000_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761840000_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1761926400_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1761926400_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1761926400_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1761926400_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1761926400_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762012800_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762012800_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762012800_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762012800_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762012800_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762099200_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762099200_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762099200_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762099200_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762099200_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762185600_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762185600_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762185600_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762185600_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762185600_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762272000_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762272000_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762272000_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762272000_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762272000_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762358400_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762358400_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762358400_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762358400_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762358400_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762444800_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762444800_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762444800_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762444800_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762444800_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762531200_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762531200_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762531200_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762531200_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762531200_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762617600_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762617600_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762617600_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762617600_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762617600_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762704000_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762704000_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762704000_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762704000_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762704000_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762790400_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762790400_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762790400_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762790400_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762790400_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762876800_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762876800_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762876800_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762876800_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762876800_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1762963200_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1762963200_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1762963200_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1762963200_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1762963200_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763049600_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763049600_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763049600_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763049600_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763049600_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763136000_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763136000_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763136000_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763136000_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763136000_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763222400_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763222400_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763222400_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763222400_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763222400_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763308800_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763308800_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763308800_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763308800_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763308800_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763395200_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763395200_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763395200_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763395200_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763395200_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763481600_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763481600_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763481600_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763481600_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763481600_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763568000_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763568000_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763568000_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763568000_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763568000_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763654400_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763654400_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763654400_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763654400_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763654400_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763740800_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763740800_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763740800_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763740800_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763740800_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763827200_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763827200_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763827200_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763827200_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763827200_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1763913600_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1763913600_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1763913600_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1763913600_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1763913600_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1764000000_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1764000000_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1764000000_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1764000000_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764000000_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_1764086400_appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          appointment_type: string | null
          created_at: string | null
          created_by_specialist: boolean | null
          id: string | null
          notes: string | null
          patient_email: string | null
          patient_name: string | null
          patient_phone: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          appointment_type?: string | null
          created_at?: string | null
          created_by_specialist?: boolean | null
          id?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_automatic_orders: {
        Row: {
          amount: number | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          created_at: string | null
          current_month: number | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          id: string | null
          is_active: boolean | null
          monthly_payment_day: number | null
          package_name: string | null
          package_type: string | null
          paid_months: number[] | null
          payment_method: string | null
          registration_date: string | null
          total_months: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          created_at?: string | null
          current_month?: number | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          id?: string | null
          is_active?: boolean | null
          monthly_payment_day?: number | null
          package_name?: string | null
          package_type?: string | null
          paid_months?: number[] | null
          payment_method?: string | null
          registration_date?: string | null
          total_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_blog_posts: {
        Row: {
          admin_message: string | null
          author_id: string | null
          author_name: string | null
          author_type: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string | null
          keywords: string | null
          published_at: string | null
          revision_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          specialist_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          admin_message?: string | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string | null
          keywords?: string | null
          published_at?: string | null
          revision_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          specialist_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: []
      }
      backup_1764086400_client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
          created_at: string | null
          id: string | null
          is_referred: boolean | null
          month: number | null
          notes: string | null
          referral_count: number | null
          referred_at: string | null
          referred_by: string | null
          specialist_id: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
          created_at?: string | null
          id?: string | null
          is_referred?: boolean | null
          month?: number | null
          notes?: string | null
          referral_count?: number | null
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      backup_1764086400_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          company_tax_no: string | null
          company_tax_office: string | null
          contract_emails_sent: boolean | null
          contract_generated_at: string | null
          contract_ip_address: string | null
          created_at: string | null
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_tc_no: string | null
          customer_type: string | null
          deleted_at: string | null
          distance_sales_pdf_content: string | null
          id: string | null
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean | null
          is_first_order: boolean | null
          package_name: string | null
          package_type: string | null
          parent_order_id: string | null
          payment_method: string | null
          payment_transaction_id: string | null
          pre_info_pdf_content: string | null
          status: string | null
          subscription_month: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          company_tax_no?: string | null
          company_tax_office?: string | null
          contract_emails_sent?: boolean | null
          contract_generated_at?: string | null
          contract_ip_address?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_tc_no?: string | null
          customer_type?: string | null
          deleted_at?: string | null
          distance_sales_pdf_content?: string | null
          id?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean | null
          is_first_order?: boolean | null
          package_name?: string | null
          package_type?: string | null
          parent_order_id?: string | null
          payment_method?: string | null
          payment_transaction_id?: string | null
          pre_info_pdf_content?: string | null
          status?: string | null
          subscription_month?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_packages: {
        Row: {
          color: string | null
          created_at: string | null
          features: string[] | null
          icon: string | null
          id: string | null
          is_active: boolean | null
          link: string | null
          name: string | null
          original_price: number | null
          package_key: string | null
          popular: boolean | null
          price: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          features?: string[] | null
          icon?: string | null
          id?: string | null
          is_active?: boolean | null
          link?: string | null
          name?: string | null
          original_price?: number | null
          package_key?: string | null
          popular?: boolean | null
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
          reviewer_email: string | null
          reviewer_name: string | null
          specialist_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
          reviewer_email?: string | null
          reviewer_name?: string | null
          specialist_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_specialists: {
        Row: {
          address: string | null
          available_days: string[] | null
          available_time_slots: Json | null
          bio: string | null
          certifications: string | null
          city: string | null
          consultation_fee: number | null
          consultation_type: string | null
          created_at: string | null
          education: string | null
          email: string | null
          experience: number | null
          face_to_face_consultation: boolean | null
          faq: string | null
          hospital: string | null
          id: string | null
          internal_number: string | null
          is_active: boolean | null
          name: string | null
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
          specialty: string | null
          university: string | null
          updated_at: string | null
          user_id: string | null
          working_hours_end: string | null
          working_hours_start: string | null
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          available_time_slots?: Json | null
          bio?: string | null
          certifications?: string | null
          city?: string | null
          consultation_fee?: number | null
          consultation_type?: string | null
          created_at?: string | null
          education?: string | null
          email?: string | null
          experience?: number | null
          face_to_face_consultation?: boolean | null
          faq?: string | null
          hospital?: string | null
          id?: string | null
          internal_number?: string | null
          is_active?: boolean | null
          name?: string | null
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
          specialty?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string | null
          working_hours_end?: string | null
          working_hours_start?: string | null
        }
        Relationships: []
      }
      backup_1764086400_test_questions: {
        Row: {
          created_at: string | null
          id: string | null
          is_required: boolean | null
          options: Json | null
          question_text: string | null
          question_type: string | null
          step_number: number | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_required?: boolean | null
          options?: Json | null
          question_text?: string | null
          question_type?: string | null
          step_number?: number | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_test_results: {
        Row: {
          answers: Json | null
          created_at: string | null
          id: string | null
          patient_email: string | null
          patient_name: string | null
          results: Json | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string | null
          id?: string | null
          patient_email?: string | null
          patient_name?: string | null
          results?: Json | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_tests: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          specialist_id: string | null
          specialty_area: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          specialist_id?: string | null
          specialty_area?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backup_1764086400_user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          is_approved: boolean | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_approved?: boolean | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
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
      blog_notifications: {
        Row: {
          blog_post_id: string
          created_at: string
          id: string
          read: boolean
          slug: string
          specialist_id: string
          title: string
          updated_at: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          id?: string
          read?: boolean
          slug: string
          specialist_id: string
          title: string
          updated_at?: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          id?: string
          read?: boolean
          slug?: string
          specialist_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_notifications_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_notifications_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
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
          specialist_id: string | null
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
          specialist_id?: string | null
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
          specialist_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_referrals: {
        Row: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
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
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
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
          client_contact?: string | null
          client_name?: string | null
          client_surname?: string | null
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
      client_referrals_backup: {
        Row: {
          backup_timestamp: string
          created_at: string
          id: string
          is_referred: boolean | null
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
          backup_timestamp?: string
          created_at?: string
          id?: string
          is_referred?: boolean | null
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
          backup_timestamp?: string
          created_at?: string
          id?: string
          is_referred?: boolean | null
          month?: number
          notes?: string | null
          referral_count?: number
          referred_at?: string | null
          referred_by?: string | null
          specialist_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      database_backups: {
        Row: {
          backup_status: string
          backup_timestamp: string
          backup_type: string
          created_at: string
          created_by: string | null
          id: number
          notes: string | null
          tables_backed_up: string[]
          total_records: number | null
        }
        Insert: {
          backup_status?: string
          backup_timestamp?: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          tables_backed_up?: string[]
          total_records?: number | null
        }
        Update: {
          backup_status?: string
          backup_timestamp?: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          tables_backed_up?: string[]
          total_records?: number | null
        }
        Relationships: []
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
          contract_pdf_url: string | null
          created_at: string
          created_by: string | null
          customer_name: string
          id: string
          invoice_pdf_url: string | null
          is_paid: boolean
          notes: string | null
          proceeding_amount: number
          status: string
          total_months: number
          unpaid_months: number
          updated_at: string
        }
        Insert: {
          contract_pdf_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_name: string
          id?: string
          invoice_pdf_url?: string | null
          is_paid?: boolean
          notes?: string | null
          proceeding_amount: number
          status: string
          total_months: number
          unpaid_months: number
          updated_at?: string
        }
        Update: {
          contract_pdf_url?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string
          id?: string
          invoice_pdf_url?: string | null
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
          invoice_date: string | null
          invoice_number: string | null
          invoice_sent: boolean
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
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean
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
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_sent?: boolean
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
      prospective_registrations: {
        Row: {
          consultant_name: string
          consultant_phone: string
          consultant_surname: string
          created_at: string
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consultant_name: string
          consultant_phone: string
          consultant_surname: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consultant_name?: string
          consultant_phone?: string
          consultant_surname?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
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
      sms_logs: {
        Row: {
          client_contact: string | null
          client_name: string | null
          created_at: string
          error: string | null
          id: string
          message: string
          phone: string
          response: Json | null
          source: string | null
          specialist_id: string | null
          specialist_name: string | null
          status: string
          triggered_by: string | null
          used_function: string | null
        }
        Insert: {
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          error?: string | null
          id?: string
          message: string
          phone: string
          response?: Json | null
          source?: string | null
          specialist_id?: string | null
          specialist_name?: string | null
          status: string
          triggered_by?: string | null
          used_function?: string | null
        }
        Update: {
          client_contact?: string | null
          client_name?: string | null
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          phone?: string
          response?: Json | null
          source?: string | null
          specialist_id?: string | null
          specialist_name?: string | null
          status?: string
          triggered_by?: string | null
          used_function?: string | null
        }
        Relationships: []
      }
      social_shares: {
        Row: {
          blog_post_id: string
          created_at: string
          error_message: string | null
          id: string
          platform: string
          shared_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          blog_post_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          shared_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          blog_post_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          shared_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_shares_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
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
          available_time_slots: Json | null
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
          available_time_slots?: Json | null
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
          available_time_slots?: Json | null
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
      website_analytics: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          last_active: string
          page_url: string
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_active?: string
          page_url: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_active?: string
          page_url?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_client_referrals: {
        Args: { p_year: number }
        Returns: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
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
        }[]
        SetofOptions: {
          from: "*"
          to: "client_referrals"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_update_client_referral_notes: {
        Args: {
          p_month: number
          p_notes: string
          p_specialist_id: string
          p_year: number
        }
        Returns: {
          client_contact: string | null
          client_name: string | null
          client_surname: string | null
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
        SetofOptions: {
          from: "*"
          to: "client_referrals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      backup_client_referrals: { Args: never; Returns: undefined }
      can_manage_users: { Args: { target_user_id?: string }; Returns: boolean }
      cleanup_old_backups: { Args: never; Returns: undefined }
      cleanup_old_sessions: { Args: never; Returns: undefined }
      create_full_database_backup: {
        Args: {
          p_backup_type?: string
          p_created_by?: string
          p_notes?: string
        }
        Returns: number
      }
      create_specialist_profile: {
        Args: { p_specialist_id: string; p_user_id: string }
        Returns: undefined
      }
      extract_first_int: { Args: { p_text: string }; Returns: number }
      generate_monthly_orders: { Args: never; Returns: undefined }
      get_current_user_role: { Args: never; Returns: string }
      get_default_time_slots: { Args: never; Returns: Json }
      get_public_reviews: {
        Args: { p_specialist_id?: string }
        Returns: {
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_display_name: string
          specialist_id: string
        }[]
      }
      get_public_specialists: {
        Args: never
        Returns: {
          address_summary: string
          available_days: string[]
          bio: string
          certifications: string
          city: string
          consultation_fee: number
          consultation_type: string
          created_at: string
          education: string
          experience: number
          face_to_face_consultation: boolean
          faq: string
          hospital: string
          id: string
          name: string
          online_consultation: boolean
          profile_picture: string
          rating: number
          reviews_count: number
          seo_description: string
          seo_keywords: string
          seo_title: string
          specialty: string
          university: string
          updated_at: string
          working_hours_end: string
          working_hours_start: string
        }[]
      }
      is_admin_or_staff_user: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_user_approved: { Args: { user_id: string }; Returns: boolean }
      list_client_referrals_backups: {
        Args: never
        Returns: {
          backup_timestamp: string
          record_count: number
        }[]
      }
      list_database_backups: {
        Args: never
        Returns: {
          backup_status: string
          backup_timestamp: string
          backup_type: string
          created_by: string
          id: number
          notes: string
          tables_count: number
          total_records: number
        }[]
      }
      merge_duplicate_client_referrals: { Args: never; Returns: undefined }
      restore_client_referrals_from_backup: {
        Args: { p_backup_timestamp: string }
        Returns: undefined
      }
      restore_from_backup: {
        Args: { p_backup_id: number; p_table_name?: string }
        Returns: undefined
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

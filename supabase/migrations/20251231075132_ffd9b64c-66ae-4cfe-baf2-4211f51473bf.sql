-- Create accounting_documents table for storing invoice files
CREATE TABLE public.accounting_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL CHECK (year >= 2026 AND year <= 2035),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounting_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for accounting documents
CREATE POLICY "Admin and muhasebe can view accounting documents"
ON public.accounting_documents
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

CREATE POLICY "Admin and muhasebe can insert accounting documents"
ON public.accounting_documents
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

CREATE POLICY "Admin and muhasebe can update accounting documents"
ON public.accounting_documents
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

CREATE POLICY "Admin and muhasebe can delete accounting documents"
ON public.accounting_documents
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

-- Create storage bucket for accounting documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('accounting-documents', 'accounting-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for accounting documents bucket
CREATE POLICY "Admin and muhasebe can upload accounting documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'accounting-documents' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

CREATE POLICY "Admin and muhasebe can view accounting documents storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'accounting-documents' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

CREATE POLICY "Admin and muhasebe can delete accounting documents storage"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'accounting-documents' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'muhasebe')
        AND is_approved = true
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_accounting_documents_updated_at
BEFORE UPDATE ON public.accounting_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
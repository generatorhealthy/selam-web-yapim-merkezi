-- Legal evidence table for storing proof of services before specialist deletion
CREATE TABLE public.legal_evidence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    specialist_id UUID, -- Can be null after specialist is deleted
    specialist_name TEXT NOT NULL,
    specialist_email TEXT,
    specialist_phone TEXT,
    specialist_tc_no TEXT,
    profile_data JSONB NOT NULL DEFAULT '{}', -- Snapshot of specialist profile
    referrals_data JSONB NOT NULL DEFAULT '[]', -- Snapshot of client referrals
    email_logs JSONB NOT NULL DEFAULT '[]', -- Logs of sent emails/documents
    orders_data JSONB NOT NULL DEFAULT '[]', -- Snapshot of related orders
    screenshot_urls TEXT[] DEFAULT '{}', -- URLs to uploaded screenshots
    notes TEXT, -- Admin notes
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- When specialist was deleted
    deleted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_evidence ENABLE ROW LEVEL SECURITY;

-- Only admins can access legal evidence
CREATE POLICY "Admins can view legal evidence"
ON public.legal_evidence
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
);

CREATE POLICY "Admins can insert legal evidence"
ON public.legal_evidence
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
);

CREATE POLICY "Admins can update legal evidence"
ON public.legal_evidence
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
);

-- Create storage bucket for legal evidence screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('legal-evidence', 'legal-evidence', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for legal evidence bucket
CREATE POLICY "Admins can upload legal evidence files"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'legal-evidence' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
);

CREATE POLICY "Admins can view legal evidence files"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'legal-evidence' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
);

CREATE POLICY "Admins can delete legal evidence files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'legal-evidence' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
        AND is_approved = true
    )
);

-- Index for faster queries
CREATE INDEX idx_legal_evidence_deleted_at ON public.legal_evidence(deleted_at DESC);
CREATE INDEX idx_legal_evidence_specialist_name ON public.legal_evidence(specialist_name);

-- Trigger for updated_at
CREATE TRIGGER update_legal_evidence_updated_at
BEFORE UPDATE ON public.legal_evidence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
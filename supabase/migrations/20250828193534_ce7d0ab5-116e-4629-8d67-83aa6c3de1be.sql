-- Create storage bucket for legal documents
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-documents', 'legal-documents', false);

-- Create storage policies for legal documents
CREATE POLICY "Legal team can view legal documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'legal-documents' AND (is_admin_user() OR (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  AND role = 'legal'::user_role 
  AND is_approved = true
))));

CREATE POLICY "Legal team can upload legal documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'legal-documents' AND (is_admin_user() OR (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  AND role = 'legal'::user_role 
  AND is_approved = true
))));

CREATE POLICY "Legal team can update legal documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'legal-documents' AND (is_admin_user() OR (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  AND role = 'legal'::user_role 
  AND is_approved = true
))));

CREATE POLICY "Legal team can delete legal documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'legal-documents' AND (is_admin_user() OR (EXISTS (
  SELECT 1 FROM public.user_profiles 
  WHERE user_id = auth.uid() 
  AND role = 'legal'::user_role 
  AND is_approved = true
))));
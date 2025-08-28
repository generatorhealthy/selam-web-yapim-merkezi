-- Add columns for contract and invoice PDF files to legal_proceedings table
ALTER TABLE public.legal_proceedings 
ADD COLUMN contract_pdf_url TEXT,
ADD COLUMN invoice_pdf_url TEXT;
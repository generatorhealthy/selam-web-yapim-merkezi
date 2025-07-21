-- Orders tablosuna müşterinin onayladığı sözleşme PDF'lerini saklamak için alanlar ekliyoruz
ALTER TABLE public.orders 
ADD COLUMN pre_info_pdf_content TEXT,
ADD COLUMN distance_sales_pdf_content TEXT,
ADD COLUMN contract_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN contract_ip_address TEXT;
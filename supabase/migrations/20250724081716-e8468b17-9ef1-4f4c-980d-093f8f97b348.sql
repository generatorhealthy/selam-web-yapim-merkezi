-- Destek talepleri tablosu oluştur
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'payment', 'account', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  admin_response TEXT,
  specialist_email TEXT NOT NULL,
  specialist_name TEXT NOT NULL
);

-- RLS'yi etkinleştir
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Uzmanlar kendi ticket'larını görebilir ve oluşturabilir
CREATE POLICY "Specialists can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = support_tickets.specialist_id 
    AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Specialists can create their own tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.specialists s 
    WHERE s.id = support_tickets.specialist_id 
    AND s.user_id = auth.uid()
  )
);

-- Admin ve staff tüm ticket'ları yönetebilir
CREATE POLICY "Admin and staff can manage all tickets" 
ON public.support_tickets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'staff') 
    AND is_approved = true
  )
);

-- Otomatik güncelleme trigger'ı
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
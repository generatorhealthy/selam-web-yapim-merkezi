-- Trigger'ı orders tablosuna bağla
DROP TRIGGER IF EXISTS send_contract_emails_on_approval_trigger ON public.orders;
CREATE TRIGGER send_contract_emails_on_approval_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_contract_emails_on_approval();
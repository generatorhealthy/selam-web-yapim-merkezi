-- Update the contract generation function to use correct order creation date
CREATE OR REPLACE FUNCTION public.generate_contract_content_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pre_info_content TEXT;
  distance_sales_content TEXT;
  form_content_data RECORD;
BEGIN
  -- Only generate content when order is approved for the first time
  IF NEW.status IN ('approved', 'completed') 
     AND OLD.status NOT IN ('approved', 'completed') 
     AND (NEW.pre_info_pdf_content IS NULL OR NEW.distance_sales_pdf_content IS NULL) THEN
    
    -- Get pre-info form content from form_contents table
    SELECT content INTO form_content_data 
    FROM public.form_contents 
    WHERE form_type = 'pre_info' 
    LIMIT 1;
    
    -- Build pre-info content with customer data
    pre_info_content := COALESCE(
      '<div style="background: #f0f9ff; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #0ea5e9;">
<h3 style="color: #0369a1; margin-top: 0;">MÜŞTERI BİLGİLERİ:</h3>
<p><strong>Müşteri Adı:</strong> ' || NEW.customer_name || '</p>
<p><strong>E-posta:</strong> ' || NEW.customer_email || '</p>
<p><strong>Telefon:</strong> ' || COALESCE(NEW.customer_phone, 'Belirtilmemiş') || '</p>
<p><strong>TC Kimlik No:</strong> ' || COALESCE(NEW.customer_tc_no, 'Belirtilmemiş') || '</p>
<p><strong>Adres:</strong> ' || COALESCE(NEW.customer_address, 'Belirtilmemiş') || '</p>
<p><strong>Şehir:</strong> ' || COALESCE(NEW.customer_city, 'Belirtilmemiş') || '</p>
<p><strong>Müşteri Tipi:</strong> ' || 
  CASE 
    WHEN NEW.customer_type = 'individual' THEN 'Bireysel' 
    ELSE 'Kurumsal' 
  END || '</p>' ||
  CASE 
    WHEN NEW.customer_type = 'company' THEN 
      '<h3 style="color: #0369a1;">KURUMSAL BİLGİLER:</h3>
<p><strong>Firma Adı:</strong> ' || COALESCE(NEW.company_name, 'Belirtilmemiş') || '</p>
<p><strong>Vergi No:</strong> ' || COALESCE(NEW.company_tax_no, 'Belirtilmemiş') || '</p>
<p><strong>Vergi Dairesi:</strong> ' || COALESCE(NEW.company_tax_office, 'Belirtilmemiş') || '</p>'
    ELSE ''
  END ||
'<h3 style="color: #0369a1;">PAKET BİLGİLERİ:</h3>
<p><strong>Seçilen Paket:</strong> ' || NEW.package_name || '</p>
<p><strong>Fiyat:</strong> ' || NEW.amount::text || ' ₺</p>
<p><strong>Ödeme Yöntemi:</strong> ' || 
  CASE 
    WHEN NEW.payment_method = 'credit_card' THEN 'Kredi Kartı' 
    ELSE 'Banka Havalesi/EFT' 
  END || '</p>
<h3 style="color: #0369a1; margin-top: 20px;">TARİHLER:</h3>
<p><strong>Sipariş Oluşturulma Tarihi:</strong> ' || TO_CHAR(NEW.created_at, 'DD.MM.YYYY') || '</p>
<p><strong>Sözleşme Onaylama Tarihi:</strong> ' || TO_CHAR(NOW(), 'DD.MM.YYYY HH24:MI') || '</p>
<p><strong>IP Adresi:</strong> ' || COALESCE(NEW.contract_ip_address, '127.0.0.1') || '</p>
</div>
<hr style="margin: 20px 0; border: 1px solid #e5e7eb;">
' || COALESCE(form_content_data.content, 'Form içeriği bulunamadı.'), 
      'Form içeriği bulunamadı.'
    );
    
    -- Build distance sales contract content
    distance_sales_content := 'KİŞİSEL VERİLERE İLİŞKİN AYDINLATMA METNİ

Doktorumol.com.tr ("doktorumol" veya "Şirket") olarak, işbu Aydınlatma Metni ile, Kişisel Verilerin Korunması Kanunu ("Kanun") ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ kapsamında aydınlatma yükümlülüğümüzün yerine getirilmesi amaçlanmaktadır.

Bu kapsamda bilgi vermekle yükümlü olduğumuz konular aşağıdaki gibidir:

1. Veri sorumlusunun ve varsa temsilcisinin kimliği

Veri sorumlusu; doktorumol.com.tr''dir.

2. Kişisel verilerin hangi amaçla işleneceği

Ad, soyadı, telefon numarası, e-posta adresi, adres bilgileri, ödeme aracı bilgileri ve bunlarla sınırlı olmamak üzere varsa internet sitesi veya çağrı merkezi aracılığıyla iletmiş olduğunuz genel ve özel nitelikli kategorilerdeki kişisel verileriniz, internet sitesinde üyeliğinizin oluşturulması, Doktorumol üyeliği sebebiyle aldığınız hizmetlerin sunumu, alınan hizmet ile ilgili sizinle iletişime geçilmesi, müşteri ilişkilerinde sağlıklı ve uzun süreli etkileşim kurulması, onay vermeniz halinde tarafınıza ticari elektronik ileti gönderilmesi, talep ve şikayetlerinizin takibi ile ilerde oluşabilecek uyuşmazlık ve sorunların çözülmesi ve mevzuattan kaynaklanan zamanaşımı süresi doğrultusunda bu kişisel verilerinizin Doktorumol tarafından saklanması amacı ile işlenmektedir.

ALICI BİLGİLERİ:
Ad Soyad: ' || NEW.customer_name || '
E-posta: ' || NEW.customer_email || '
Telefon: ' || COALESCE(NEW.customer_phone, 'Belirtilmemiş') || '
Adres: ' || COALESCE(NEW.customer_address, 'Belirtilmemiş') || '
Şehir: ' || COALESCE(NEW.customer_city, 'Belirtilmemiş') || '

ÜRÜN/HİZMET BİLGİLERİ:
Ürün/Hizmet: ' || NEW.package_name || '
Fiyat: ' || NEW.amount::text || ' ₺
Ödeme Şekli: ' || 
  CASE 
    WHEN NEW.payment_method = 'credit_card' THEN 'Kredi Kartı' 
    ELSE 'Banka Havalesi/EFT' 
  END || '

Sipariş Oluşturulma Tarihi: ' || TO_CHAR(NEW.created_at, 'DD.MM.YYYY') || '
Sözleşme Onaylama Tarihi: ' || TO_CHAR(NOW(), 'DD.MM.YYYY HH24:MI') || '
IP Adresi: ' || COALESCE(NEW.contract_ip_address, '127.0.0.1');
    
    -- Update the record with contract content
    NEW.pre_info_pdf_content = pre_info_content;
    NEW.distance_sales_pdf_content = distance_sales_content;
    NEW.contract_generated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$function$
-- İrem Dağ'ı aktif hale getir
UPDATE automatic_orders
SET is_active = true
WHERE customer_name = 'Psk. İrem Dağ';

-- Siparişleri oluştur
SELECT generate_monthly_orders();
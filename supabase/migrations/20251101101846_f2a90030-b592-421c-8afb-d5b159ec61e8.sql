-- Otomatik sipariş oluşturma cron job'larını kaldır
SELECT cron.unschedule('daily-order-generator');
SELECT cron.unschedule('generate-monthly-orders');
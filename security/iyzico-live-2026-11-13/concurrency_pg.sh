#!/usr/bin/env bash
# Yerel, sentetik PostgreSQL: üretimdeki migration dosyasının kendisi + sipariş tetikleyicilerinin
# fatura/bildirim iş üreten koşullarının aynası. Gerçek müşteri/ödeme/fatura yok.
set -euo pipefail
MIG="${MIG:-$(dirname "$0")/../../supabase/migrations/20261113080553_68f5e3ed-2dfd-4e9c-9a08-0bb2969c172b.sql}"
D=$(mktemp -d); PORT=55433
initdb -D "$D" -U postgres >/dev/null; pg_ctl -D "$D" -o "-p $PORT -k $D -c max_connections=60" -l "$D/log" start >/dev/null
trap 'pg_ctl -D "$D" stop -m immediate >/dev/null' EXIT
P="psql -h $D -p $PORT -U postgres -qAt -v ON_ERROR_STOP=1"
$P <<'SQL'
create role anon; create role authenticated; create role service_role;
create table public.orders(id uuid primary key, customer_email text not null, customer_name text default 'S', amount numeric not null,
  status text not null default 'pending', payment_method text not null default 'credit_card', is_first_order boolean default true,
  deleted_at timestamptz, approved_at timestamptz, payment_status text, payment_transaction_id text,
  subscription_reference_code text, iyzico_customer_reference_code text, invoice_sent boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now());
create table public.automatic_orders(id serial, customer_email text, subscription_reference_code text, iyzico_customer_reference_code text);
create table jobs(kind text, order_id uuid);
-- Üretimdeki auto_create_invoice_on_approval ve send_contract_emails_on_approval / activate_specialist koşulunun aynası
create function mirror() returns trigger language plpgsql as $$ begin
  if NEW.status in ('approved','completed') and OLD.status not in ('approved','completed') then
    insert into jobs values ('activation',NEW.id);
    if coalesce(NEW.invoice_sent,false)=false then insert into jobs values ('invoice',NEW.id); end if;
    insert into jobs values ('notification',NEW.id);
  end if; return NEW; end $$;
create trigger mirror after update on public.orders for each row execute function mirror();
SQL
$P -f "$MIG"
$P <<'SQL'
insert into orders(id,customer_email,amount) values ('11111111-1111-4111-8111-111111111111','buyer@example.invalid',4000),
 ('22222222-2222-4222-8222-222222222222','other@example.invalid',4000),('33333333-3333-4333-8333-333333333333','first@example.invalid',4000);
insert into payment_checkout_sessions(id,order_id,conversation_id,iyzico_token,plan_ref,expected_amount,status)
 values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','conv-1','tok-1','e0d7e6b7-e665-4460-ab8f-6bb6e7a2c652',4000,'initialized');
SQL
CALL="select settle_iyzico_payment('11111111-1111-4111-8111-111111111111','iyzico:sub-1:charge-1','sub-1','cust-1','charge-1',4000,'TRY',now()-interval '1 minute','checkout_callback','checkout_session','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'outcome'"
for i in $(seq 1 20); do $P -c "$CALL" > "$D/out.$i" & done; wait
echo "20 eşzamanlı: $(cat $D/out.* | sort | uniq -c | tr '\n' ' ')"
$P -c "select kind, count(*) from jobs group by 1 order by 1" | tr '\n' ' '; echo
$P -c "select 'receipts='||count(*) from payment_receipts"
$P -c "select 'order='||status||','||payment_status||','||subscription_reference_code from orders where id='11111111-1111-4111-8111-111111111111'"
$P -c "select 'session='||status from payment_checkout_sessions"
echo "aynı tahsilat başka siparişe: $($P -c "select settle_iyzico_payment('22222222-2222-4222-8222-222222222222','iyzico:sub-1:charge-1','sub-1','cust-1','charge-1',4000,'TRY',now(),'x','subscription_ref',null)::text")"
echo "oturumsuz ilk sipariş: $($P -c "select settle_iyzico_payment('33333333-3333-4333-8333-333333333333','iyzico:sub-9:c','sub-9','cust-9','c',4000,'TRY',now(),'x','subscription_ref',null)::text")"
echo "yanlış tutar: $($P -c "select settle_iyzico_payment('33333333-3333-4333-8333-333333333333','iyzico:sub-8:c','sub-8','cust-8','c',2398,'TRY',now(),'x','checkout_session',null)::text")"
echo "toplam iş: $($P -c "select count(*) from jobs")"
echo "anon yetkisi: $($P -c "select has_function_privilege('anon','public.settle_iyzico_payment(uuid,text,text,text,text,numeric,text,timestamptz,text,text,uuid)','execute')")/$($P -c "select has_function_privilege('authenticated','public.settle_iyzico_payment(uuid,text,text,text,text,numeric,text,timestamptz,text,text,uuid)','execute')")"

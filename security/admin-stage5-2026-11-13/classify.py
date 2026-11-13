"""Classifies exact catalog warning instances, not fabricated historical IDs."""
import json,re,pathlib,collections
ROOT=pathlib.Path(__file__).parent
s=pathlib.Path('/tmp/tool-results/supabase--read_query/20261113-114908-750745').read_text();rows=json.JSONDecoder().raw_decode(s[s.index('inventory:[')+10:])[0]
ROOT.joinpath('function-grants-final.json').write_text(json.dumps(rows,indent=2))
old=json.loads(ROOT.joinpath('functions.json').read_text());defs={(x['name'],x['args']):x['definition'] for x in old}
public={'get_public_reviews','get_public_specialists','get_specialist_basic_info','get_public_specialist_by_slug','get_referrer_by_code','get_specialist_follower_count','resolve_specialist_slug','get_default_time_slots','extract_first_int','normalize_ref_code'}
fixed={'attach_signup_identity_to_analytics','register_partner_referral','is_admin_user'}
items=[]
for x in rows:
 for role in ['anon','authenticated']:
  if not x[role]:continue
  d=defs.get((x['name'],x['args']),'')
  if x['return']=='trigger':severity='yanlış pozitif';reason='Trigger return type prevents direct RPC execution; invocation only in table trigger context.';status='korundu';group='trigger-only'
  elif x['name'] in public:severity='yanlış pozitif';reason='Explicit public profile/review/catalog output; public contact email/phone omitted from profile RPC.';status='korundu';group='public-output'
  elif x['name'] in fixed:severity='yanlış pozitif';reason='Verified auth.uid ownership/server-read identity, or approved current-admin boolean; new catalog flag is expected access not unguarded data.';status='düzeltildi';group='verified-identity'
  elif x['name']=='update_registration_analytics':severity='orta';reason='Known session ID permits telemetry overwrite within 2 days; no private read, separate consent-compatible migration needed.';status='açık';group='telemetry-integrity'
  elif re.search(r'is_admin|session_user|service_role|get_current_user_role|current_partner_id|auth\.uid',d):severity='düşük';reason='Body contains authorization/ownership gate; individual full handler and hosted role acceptance incomplete where not covered by role-matrix.';status='inceleme';group='body-guard'
  else:severity='orta';reason='Approval/status or generator helper metadata; no unrestricted clinical/payment row read found; exact execution behavior needs focused acceptance.';status='inceleme';group='metadata-helper'
  items.append({'id':f'{role}:{x["name"]}({x["args"]})','object':'public.'+x['name'],'role':role,'severity':severity,'group':group,'evidence':reason,'status':status})
items.extend([
 {'id':'0008:consent_transactions','object':'public.consent_transactions','severity':'yanlış pozitif','group':'service-only','evidence':'RLS on, no user policy: intentional fail-closed service-only consent capability store.','status':'korundu'},
 {'id':'0011:search_path','object':'public: mutable function search_path','severity':'düşük','group':'configuration','evidence':'One mutable-path catalog warning; exact function not supplied by aggregate linter, cannot assert resolved.','status':'açık'},
 {'id':'0014:extension','object':'public extension','severity':'düşük','group':'configuration','evidence':'One extension-in-public warning; moving managed extension without dependency acceptance deferred.','status':'açık'}])
ROOT.joinpath('warning-inventory.json').write_text(json.dumps(items,ensure_ascii=False,indent=2))
counts=collections.Counter(x['severity'] for x in items)
text='# Güvenlik uyarıları — nesne bazlı envanter\n\nÖnceki 174 uyarının birebir tarihsel nesne listesi yoktur; kayıp 14 satır uydurulmadı. Bu tur başlangıcı 167, giriş paketi sonrası 163, yetki paketi sonrası 160 (71 anonim + 86 authenticated + 3 yapılandırma). Güncel '+str(len(items))+' satırın tamamı warning-inventory.json içinde rol ve imza bazında verilmiştir.\n\n'+str(dict(counts))+'\n\nKatalog uyarısı gerçek açık sayısı değildir. Yeni üç işaret: admin boolean gate ve authenticated identity/partner RPC erişimi; gövde doğrulaması ve sentetik kabul var, genel EXECUTE yetkisini kaldırmak RLS/kayıt akışını bozar. Beklenen erişim olarak yanlış pozitif sınıflandırıldı; yeni unguarded yetki açığı yok.\n\nAyrıca katalog dışı açık: iyzico-subscription-upgrade ortak helper staff rolüne abonelik değişikliği izni veriyor; panelde gizli olsa bile sunucu admin-only değil. Bu işlemin tam eylem kabulü yapılmadı, yüksek öncelikli açık olarak ayrı paket bekler. Sağlayıcı testi yapılmadı.\n\n'
for x in items:text+=f'- `{x["id"]}` — **{x["severity"]}**, {x["status"]}: {x["evidence"]}\n'
ROOT.joinpath('WARNINGS.md').write_text(text)
print('warnings',len(items),dict(counts))

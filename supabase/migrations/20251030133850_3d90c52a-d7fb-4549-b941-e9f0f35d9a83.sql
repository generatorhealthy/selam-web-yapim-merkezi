-- Remove clause 5.6 from pre-info form content
UPDATE form_contents 
SET content = REPLACE(
  content,
  '<p>5.6. Taraflar, işbu Sözleşme''nin 5.5. maddesinde belirtilen Hizmet dışında, Premium Üyelik kapsamında Hizmet Alan tarafından talep edilen diğer Hizmetlerin, Hizmet Alan''ın yazılı talebini takiben ve Doktorum Ol tarafından istenen vergi levhası, kimlik fotokopisi gibi belgelerin gönderilmesi şartıyla 30 (otuz) gün içinde Doktorum Ol tarafından sunulacağını kabul ederler."</p><p><br></p><p>',
  ''
),
updated_at = now()
WHERE form_type = 'pre_info';
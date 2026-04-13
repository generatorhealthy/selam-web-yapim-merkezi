UPDATE public.tests
SET title = regexp_replace(title, 'Elif Güllü', 'Elif Gülgü'),
    updated_at = now()
WHERE specialist_id = 'e1afd467-27eb-45f7-9703-21e053a9b3c7'
  AND title LIKE '%Elif Güllü%';
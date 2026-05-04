// IndexNow ile arama motorlarına (Bing, Yandex vs.) URL güncellemesi bildirir.
// DB trigger veya manuel çağrı ile tetiklenir.
// Body: { urls: string[] }  veya  { type: 'blog'|'specialist'|'test', slug?: string, id?: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const INDEXNOW_KEY = '07ec0032887ffbe4849b57b9898e85dd'
const HOST = 'doktorumol.com.tr'
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`

function trSlug(text: string): string {
  return (text || '').toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({}))
    let urls: string[] = []

    if (Array.isArray(body.urls)) {
      urls = body.urls
    } else if (body.type === 'blog' && body.slug) {
      urls = [`https://${HOST}/blog/${body.slug}`, `https://${HOST}/blog`, `https://${HOST}/sitemap.xml`]
    } else if (body.type === 'specialist' && body.id) {
      const { data } = await supabase.from('specialists').select('name, specialty, slug').eq('id', body.id).maybeSingle()
      if (data) {
        const specSlug = trSlug(data.specialty)
        const nameSlug = (data as any).slug || trSlug(data.name)
        urls = [
          `https://${HOST}/${specSlug}/${nameSlug}`,
          `https://${HOST}/uzmanlar`,
          `https://${HOST}/uzmanlik/${specSlug}`,
          `https://${HOST}/sitemap.xml`,
        ]
      }
    } else if (body.type === 'test' && body.id) {
      urls = [`https://${HOST}/test/${body.id}`, `https://${HOST}/sitemap.xml`]
    }

    urls = Array.from(new Set(urls.filter(Boolean)))
    if (urls.length === 0) {
      return new Response(JSON.stringify({ ok: false, reason: 'no urls' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      })
    }

    const payload = { host: HOST, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList: urls }

    // Bing IndexNow (Yandex de aynı protokolü destekler)
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
    ]
    const results = await Promise.allSettled(endpoints.map(ep =>
      fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }).then(r => ({ endpoint: ep, status: r.status }))
    ))

    console.log('IndexNow results:', JSON.stringify(results), 'urls:', urls.length)

    return new Response(JSON.stringify({ ok: true, urls, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('notify-search-engines error', e)
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})

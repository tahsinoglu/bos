// Vercel sunucu fonksiyonu: kitap sayfası fotoğrafını Claude ile metne çevirir.
// ANTHROPIC_API_KEY ortam değişkeni yoksa 503 döner; uygulama o zaman cihazdaki OCR'a geçer.
import Anthropic from '@anthropic-ai/sdk'

const PROMPT = `Bu, telefonla çekilmiş bir kitap sayfası fotoğrafı (ya da bir kısmı). Okurun altını çizmek istediği alıntıyı kaydediyoruz.

Görevin: Fotoğraftaki ana sayfanın metnini, kitapta yazdığı haliyle, kelimesi kelimesine çıkar.
- Yalnızca fotoğrafın odağındaki ana sayfayı oku. Kenarda görünen karşı sayfanın kesik satırlarını, sayfa üstündeki kitap/bölüm başlığını (running header) ve dipnot numaralarını alma.
- Satır sonunda tireyle bölünmüş kelimeleri birleştir ("giy-" + "diği" → "giydiği"). Satır sonlarını kaldır; paragrafları boş satırla ayır. Diyalog tirelerini (- ) koru.
- Yazım, noktalama ve Türkçe karakterleri (â, î, û, ş, ğ, İ...) aynen koru; düzeltme, özetleme veya yorum yapma.
- Fotoğrafın kenarında kesilmiş, yarım kalan satırları ancak kelimeler net okunuyorsa al.
- Sayfa numarası görünüyorsa "page" alanına yalnızca sayıyı yaz, metne ekleme. Görünmüyorsa null.
- Okunabilir metin yoksa "text" alanını boş bırak.`

const SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'Sayfadaki metin' },
    page: { type: ['string', 'null'], description: 'Sayfa numarası veya null' },
  },
  required: ['text', 'page'],
  additionalProperties: false,
}

const MAX_BASE64 = 4_000_000 // ~3 MB görsel (Vercel istek sınırı 4.5 MB)

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503)

  let image: string, mediaType: string
  try {
    const body = (await request.json()) as { image?: string; mediaType?: string }
    image = body.image ?? ''
    mediaType = body.mediaType ?? 'image/jpeg'
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  if (!image || image.length > MAX_BASE64 || !['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) {
    return json({ error: 'bad_image' }, 400)
  }

  const client = new Anthropic()
  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    })
    if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 422)
    const block = response.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') return json({ error: 'empty' }, 502)
    const out = JSON.parse(block.text) as { text: string; page: string | null }
    return json({ text: out.text.trim(), page: out.page?.replace(/\D/g, '') || null })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'rate_limited' }, 429)
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'bad_key' }, 503)
    if (e instanceof Anthropic.APIError) return json({ error: 'api_error', status: e.status }, 502)
    return json({ error: 'failed' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}

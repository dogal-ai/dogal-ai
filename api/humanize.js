export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  const { text, tone } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Metin boş olamaz.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API anahtarı Vercel üzerinde tanımlanmamış.' });
  }

  const systemPrompt = `Sen profesyonel bir metin insanileştiricisin. Yapay zeka tarafından üretilmiş metinleri alıp, tıpkı doğal bir insanın yazacağı şekilde akıcı, samimi ve anlaşılır hale getiriyorsun.

Gelen metni "${tone}" tonda yeniden yaz. 
Kurallar:
- Yapay zeka kalıplarından, resmi ve robotik ifadelerden kaçın.
- Anlamı koru ancak metni doğal bir insan üslubuna kavuştur.
- Sadece dönüştürülmüş metni ver, açıklama veya başlık ekleme.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nDönüştürülecek Metin:\n${text}` }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API Hatası');
    }

    const humanizedText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ result: humanizedText });

  } catch (error) {
    return res.status(500).json({ error: 'İnsanileştirme sırasında bir hata oluştu: ' + error.message });
  }
}

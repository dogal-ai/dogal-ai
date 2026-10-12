export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  const { text, tone } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Lütfen dönüştürülecek bir metin girin.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel üzerinde GEMINI_API_KEY tanımlı değil.' });
  }

  const systemPrompt = `Sen metin insanileştirme konusunda uzmanlaşmış profesyonel bir editörsün. Yapay zeka tarafından üretilmiş, resmi, kalıplaşmış veya robotik metinleri alır ve tam anlamıyla doğal bir insanın elinden çıkmış gibi akıcı, samimi ve kaliteli bir dile dönüştürürsün.

Aşağıdaki metni "${tone}" bir anlatım tarzıyla yeniden yaz.
Kurallar:
- Yapay zeka kalıplarını (örn. "Sonuç olarak", "Özetle", "Gelişen dünyada", "Göz önüne alındığında" vb.) tamamen kaldır.
- Metnin ana fikrini ve doğruluğunu koru.
- Doğal paragraf geçişleri ve akıcı cümleler kullan.
- Sadece dönüştürülen metni yanıt olarak ver. Başlık, açıklama veya "İşte metniniz:" gibi ek sözler ekleme.`;

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
              parts: [{ text: `${systemPrompt}\n\nİnsanileştirilecek Metin:\n${text}` }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API Hatası oluştu.');
    }

    const humanizedText = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ result: humanizedText });

  } catch (error) {
    return res.status(500).json({ error: 'İşlem sırasında bir hata oluştu: ' + error.message });
  }
}

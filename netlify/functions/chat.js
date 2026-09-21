// Netlify Function - roda no servidor, nunca expõe a chave pro navegador.
// A chave fica salva como variável de ambiente no painel do Netlify (GEMINI_API_KEY).

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido.' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY não configurada no Netlify. Vá em Site settings > Environment variables.' })
    };
  }

  let prompt;
  try {
    var body = JSON.parse(event.body || '{}');
    prompt = body.prompt;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Corpo da requisição inválido.' }) };
  }

  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Nenhuma pergunta enviada.' }) };
  }

  // Modelo Gemini usado. Se esse nome parar de funcionar, troque para o modelo
  // ativo mais recente listado em https://ai.google.dev/gemini-api/docs/models
  var model = 'gemini-3.6-flash';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

  try {
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });

    var data = await resp.json();

    if (!resp.ok) {
      var msg = (data && data.error && data.error.message) || 'Erro na API do Gemini.';
      return { statusCode: resp.status, body: JSON.stringify({ error: msg }) };
    }

    var text = (data.candidates && data.candidates[0] && data.candidates[0].content &&
                data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
                data.candidates[0].content.parts[0].text) || '';

    return { statusCode: 200, body: JSON.stringify({ text: text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Falha ao conectar com o Gemini: ' + err.message }) };
  }
};

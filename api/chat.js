export default async function handler(req, res) {

  // handle the preflight request that browsers send before the real request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // allow requests from any origin including github pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  var groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server' });
  }

  var messages = req.body.messages;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages are missing or in the wrong format' });
  }

  try {
    var groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + groqApiKey
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!groqResponse.ok) {
      var errorData = await groqResponse.json().catch(function() { return {}; });
      var errorMessage = errorData.error ? errorData.error.message : 'Groq API error ' + groqResponse.status;
      return res.status(groqResponse.status).json({ error: errorMessage });
    }

    var data = await groqResponse.json();
    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}

// this file runs on Vercel's servers, not in the browser
// so the API key stored here as an environment variable is completely hidden
// the browser never sees it

export default async function handler(req, res) {

  // only allow POST requests, reject everything else
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  // grab the API key from Vercel's environment variables
  // you set this in the Vercel dashboard, it never appears in your code
  var groqApiKey = process.env.GROQ_API_KEY;

  // if the key is missing, return an error
  if (!groqApiKey) {
    return res.status(500).json({ error: 'API key is not configured on the server' });
  }

  // get the messages the frontend sent us
  var messages = req.body.messages;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages are missing or in the wrong format' });
  }

  try {
    // now we call Groq from the server using the hidden key
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

    // if Groq returned an error, pass it back to the frontend
    if (!groqResponse.ok) {
      var errorData = await groqResponse.json().catch(function() { return {}; });
      var errorMessage = errorData.error ? errorData.error.message : 'Groq API error ' + groqResponse.status;
      return res.status(groqResponse.status).json({ error: errorMessage });
    }

    var data = await groqResponse.json();

    // send the AI reply back to the frontend
    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
}

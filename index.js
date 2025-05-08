// index.js
const express    = require('express');
const bodyParser = require('body-parser');
const path       = require('path');

const app = express();

// serve static assets & root page
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// chat endpoint
app.post('/chat', async (req, res) => {
  const { message }   = req.body;
  const openaiKey     = process.env.OPENAI_API_KEY;
  if (!openaiKey) return res.status(500).json({ error: 'Missing OpenAI key' });

  try {
    const resp = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model:    'gpt-4',
          messages: [{ role: 'user', content: message }]
        })
      }
    );

    const json = await resp.json();
    if (!resp.ok) {
      console.error('OpenAI error:', json);
      return res.status(500).json({ error: 'OpenAI failure', details: json });
    }

    const reply = json.choices?.[0]?.message?.content || 'No reply.';
    res.json({ reply });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// listen on 0.0.0.0 so Fly can route in
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () =>
  console.log(`Server listening on http://0.0.0.0:${port}`)
);

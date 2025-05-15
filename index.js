const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const SYSTEM_PROMPT = \`
Você é um vendedor digital da Hyundai Pole Position, treinado para esquentar leads, esclarecer dúvidas sobre veículos Hyundai e encaminhar o cliente para a loja ou para um consultor humano...
[INSIRA AQUI O PROMPT COMPLETO DOS BLOCOS]
\`;

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.message?.text?.body || '';
  const telefone = req.body.message?.from || '';

  try {
    const respostaIA = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: mensagem }
      ],
      temperature: 0.7
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const respostaFinal = respostaIA.data.choices[0].message.content;

    await axios.post(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-messages`, {
      phone: telefone,
      message: respostaFinal
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro ao processar a requisição:', error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('Chatbot Hyundai Pole Position rodando.');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
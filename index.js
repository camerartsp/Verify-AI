const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const isRender = process.env.RENDER === "true";
const puppeteerOptions = isRender ? { 
  headless: true, 
  args: ['--no-sandbox', '--disable-setuid-sandbox'], 
  executablePath: '/opt/render/.cache/puppeteer/chrome/linux-126.0.6478.61/chrome' 
} : { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };

// Função para extrair texto da página
async function extractTextFromPage(url) {
  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Tenta encontrar o texto usando diferentes seletores comuns
  const selectorsToTry = ['body', 'article', 'main', '#content', '.content'];
  let textContent = '';
  for (const selector of selectorsToTry) {
    try {
      console.log(`Tentando extrair texto com o seletor '${selector}' na página ${url}`);
      await page.waitForSelector(selector, { timeout: 10000 });
      textContent = await page.evaluate((selector) => document.querySelector(selector).innerText, selector);
      console.log(`Texto extraído com sucesso usando o seletor '${selector}'.`);
      break;
    } catch (error) {
      console.log(`Não foi possível extrair texto com o seletor '${selector}':`, error.message);
    }
  }

  await browser.close();

  if (textContent === '') {
    console.warn('Não foi possível extrair o texto da página usando nenhum dos seletores padrão.');
    return null;
  }
  return textContent;
}

// Função para extrair informações da análise da IA
function extractAnalysisData(analysisText) {
  const riskScoreMatch = analysisText.match(/Risk Score:\s*(.*)/);
  const summaryMatch = analysisText.match(/Summary:\s*(.*)/);
  const accuracyMatch = analysisText.match(/Accuracy Percentage:\s*(.*)/);

  let riskScore = riskScoreMatch ? riskScoreMatch[1].trim() : 'Unknown';
  
  if (riskScore.toLowerCase().includes('medium')) {
    riskScore = 'Moderadamente Confiável';
  }

  return {
    riskScore,
    summary: summaryMatch ? summaryMatch[1].trim() : 'No summary available',
    accuracy: accuracyMatch ? accuracyMatch[1].trim() : 'Unknown',
  };
}

async function analyzeNews(url) {
  try {
    const textContent = await extractTextFromPage(url);
    if (!textContent) {
      throw new Error('Não foi possível extrair o conteúdo da página.');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are a specialized AI model designed to analyze the reliability of news articles based on their content. Provide evidence to support your analysis.',
    });

    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 50,
      maxOutputTokens: 2048,
      responseMimeType: 'text/plain',
    };

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: 'user',
          parts: [{ text: 'Analyze the reliability of the following news article text and provide a risk score, a summary, an accuracy percentage, and evidence to support your claims.' }],
        },
        {
          role: 'user',
          parts: [{ text: textContent }],
        },
      ],
    });

    const result = await chatSession.sendMessage('Analyze this text for news reliability.');
    console.log(`Resultado da análise: ${result.response.text()}`);
    const analysisData = extractAnalysisData(result.response.text());

    return {
      ...analysisData,
      url,
    };
  } catch (error) {
    console.error(`Erro ao analisar a notícia: ${error}`);
    throw error;
  }
}

app.post('/analyze', async (req, res) => {
  const url = req.body.url;
  console.log(`Recebendo URL para análise: ${url}`);
  if (url) {
    try {
      const analysisResult = await analyzeNews(url);
      res.json(analysisResult);
    } catch (error) {
      console.error(`Erro ao analisar a notícia: ${error}`);
      res.status(500).json({ error: error.message || 'Erro ao analisar a notícia.' });
    }
  } else {
    console.log('Nenhum link fornecido.');
    res.status(400).json({ error: 'Nenhum link fornecido.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
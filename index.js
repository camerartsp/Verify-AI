const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = 3000;

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Função para extrair texto da página
async function extractTextFromPage(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    try {
        console.log(`Esperando o seletor 'body' na página ${url}`);
        await page.waitForSelector('body', { timeout: 30000 });
    } catch (error) {
        console.error(`Timeout ao esperar pelo seletor na página ${url}:`, error);
    }

    const textContent = await page.evaluate(() => document.body.innerText);
    await browser.close();
    console.log('Texto extraído da página.');
    return textContent;
}

// Função para extrair informações da análise da IA
function extractAnalysisData(analysisText) {
    const riskScoreMatch = analysisText.match(/Risk Score:\s*(.*)/);
    const summaryMatch = analysisText.match(/Summary:\s*(.*)/);
    const accuracyMatch = analysisText.match(/Accuracy Percentage:\s*(.*)/);

    return {
        riskScore: riskScoreMatch ? riskScoreMatch[1].trim() : 'Unknown',
        summary: summaryMatch ? summaryMatch[1].trim() : 'No summary available',
        accuracy: accuracyMatch ? accuracyMatch[1].trim() : 'Unknown',
    };
}

async function analyzeNews(url) {
    try {
        const textContent = await extractTextFromPage(url);

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: 'You are a specialized AI model designed to analyze the reliability of news articles based on their content.',
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
                    parts: [{ text: 'Analyze the reliability of the following news article text and provide a risk score, a summary, and an accuracy percentage.' }],
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
            res.status(500).json({ error: 'Erro ao analisar a notícia.' });
        }
    } else {
        console.log('Nenhum link fornecido.');
        res.status(400).json({ error: 'Nenhum link fornecido.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

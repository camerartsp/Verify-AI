const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require('fs').promises;
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = "Você é um assistente especializado em análise de conteúdo e detecção de notícias falsas. Sua tarefa é analisar o conteúdo fornecido e determinar sua credibilidade. Forneça uma pontuação de credibilidade de 0 a 100, onde 0 é completamente falso e 100 é completamente verdadeiro. Além disso, forneça uma breve explicação para sua avaliação. Responda APENAS no seguinte formato: Pontuação de Credibilidade: [número]; Explicação: [sua explicação]";

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  generationConfig: {
    temperature: 1,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 1024,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

async function fileToBase64(filePath) {
  const fileContent = await fs.readFile(filePath);
  return fileContent.toString('base64');
}

async function analisarNoticia(texto, arquivos) {
  try {
    let parts = [];

    if (texto) {
      parts.push({ text: `Analise o seguinte texto: "${texto}"` });
    }

    if (arquivos && arquivos.length > 0) {
      for (let arquivo of arquivos) {
        const base64Content = await fileToBase64(arquivo.path);
        parts.push({
          inlineData: {
            mimeType: arquivo.mimetype,
            data: base64Content,
          },
        });
        parts.push({ text: `Analise a mídia acima.` });
      }
    }

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: parts }
      ],
      generationConfig: {
        temperature: 1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
      systemInstruction: systemInstruction
    });

    const resposta = result.response.text();
    console.log("Resposta completa da API:", resposta);

    const pontuacaoMatch = resposta.match(/Pontuação de Credibilidade:\s*(\d+)/i);
    const explicacaoMatch = resposta.match(/Explicação:\s*([\s\S]+)/i);

    if (!pontuacaoMatch || !explicacaoMatch) {
      console.log("Formato de resposta inesperado. Resposta completa:", resposta);
      return {
        pontuacaoCredibilidade: 0,
        explicacao: "Não foi possível analisar o conteúdo. Por favor, tente novamente.",
        eConfiavel: false
      };
    }

    const pontuacaoCredibilidade = parseInt(pontuacaoMatch[1]);
    const explicacao = explicacaoMatch[1].trim();

    console.log("Pontuação de Credibilidade:", pontuacaoCredibilidade);
    console.log("Explicação:", explicacao);

    return {
      pontuacaoCredibilidade: isNaN(pontuacaoCredibilidade) ? 0 : pontuacaoCredibilidade,
      explicacao,
      eConfiavel: pontuacaoCredibilidade >= 70,
    };

  } catch (erro) {
    console.error('Erro detalhado:', erro);
    return {
      pontuacaoCredibilidade: 0,
      explicacao: 'Erro ao analisar o conteúdo. Por favor, tente novamente.',
      eConfiavel: false,
      detalhes: erro.message
    };
  }
}

module.exports = { analisarNoticia };

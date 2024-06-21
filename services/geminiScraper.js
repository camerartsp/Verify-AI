const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const vision = require('@google-cloud/vision');
const fs = require('fs');
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction: `
    Você é um especialista em análise de notícias e verificação de fatos. 
    Sua tarefa é avaliar a credibilidade de artigos de notícias com base em critérios como:
    - A precisão das informações apresentadas.
    - A presença de fontes confiáveis.
    - A ausência de vieses evidentes.
    - O contexto e a completude da informação fornecida.
    Sua resposta deve ser objetiva e seguir o formato solicitado.
  `,
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
};

async function analisarNoticia(texto, imagem, video) {
  try {
    let conteudo = texto || '';

    if (imagem) {
      const client = new vision.ImageAnnotatorClient();
      const [result] = await client.textDetection(imagem.path);
      const detections = result.textAnnotations;
      conteudo += detections.length ? detections[0].description : '';
      fs.unlinkSync(imagem.path);
    }

    if (video) {
      // Placeholder for video analysis, which could include extracting frames and performing OCR or other analysis.
      conteudo += ' Análise de vídeo não implementada. ';
      fs.unlinkSync(video.path);
    }

    if (!conteudo) {
      throw new Error('Nenhum conteúdo para analisar.');
    }

    const chatSession = model.startChat({
      generationConfig,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const prompt = `
      Analise o seguinte artigo de notícias e determine se é confiável ou não. 
      Forneça uma pontuação de credibilidade de 0 a 100, onde 0 é completamente falso e 100 é completamente verdadeiro.
      Além disso, forneça uma breve explicação para sua avaliação.

      Conteúdo do artigo:
      ${conteudo}

      Responda no seguinte formato:
      Pontuação de Credibilidade: [número]
      Explicação: [sua explicação]
    `;

    const result = await chatSession.sendMessage(prompt);
    const resposta = result.response.text();

    const linhas = resposta.split('\n');
    const pontuacaoLinha = linhas.find(linha => linha.includes('Pontuação de Credibilidade:'));
    const explicacaoInicio = linhas.findIndex(linha => linha.includes('Explicação:'));

    if (!pontuacaoLinha || explicacaoInicio === -1) {
      throw new Error('Formato de resposta inesperado.');
    }

    const pontuacaoCredibilidade = parseInt(pontuacaoLinha.split(':')[1].trim());
    const explicacao = linhas.slice(explicacaoInicio + 1).join('\n').trim();

    return {
      pontuacaoCredibilidade,
      explicacao,
      eConfiavel: pontuacaoCredibilidade >= 70,
    };

  } catch (erro) {
    console.error('Erro:', erro);
    return {
      erro: 'Erro ao analisar o artigo. Por favor, tente novamente.',
    };
  }
}

module.exports = { analisarNoticia };
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require('fs').promises;
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

async function fileToBase64(filePath) {
  const fileContent = await fs.readFile(filePath);
  return fileContent.toString('base64');
}

async function analisarNoticia(texto, imagem, video) {
  try {
    let conteudo = texto || '';
    let parts = [];

    if (conteudo) {
      parts.push({text: conteudo});
    }

    if (imagem) {
      const base64Image = await fileToBase64(imagem.path);
      parts.push({
        inlineData: {
          mimeType: imagem.mimetype,
          data: base64Image
        }
      });
    }

    if (video) {
      const base64Video = await fileToBase64(video.path);
      parts.push({
        inlineData: {
          mimeType: video.mimetype,
          data: base64Video
        }
      });
    }

    const prompt = `
      Analise o seguinte conteúdo (que pode incluir texto, imagem e/ou vídeo) e determine se é confiável ou não. 
      Forneça uma pontuação de credibilidade de 0 a 100, onde 0 é completamente falso e 100 é completamente verdadeiro.
      Além disso, forneça uma breve explicação para sua avaliação.

      Responda no seguinte formato:
      Pontuação de Credibilidade: [número]
      Explicação: [sua explicação]
    `;

    parts.push({text: prompt});

    const chatSession = model.startChat({
      generationConfig,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await chatSession.sendMessage(parts);
    const resposta = result.response.text();

    const linhas = resposta.split('\n');
    const pontuacaoLinha = linhas.find(linha => linha.includes('Pontuação de Credibilidade:'));
    const explicacaoInicio = linhas.findIndex(linha => linha.includes('Explicação:'));

    if (!pontuacaoLinha || explicacaoInicio === -1) {
      throw new Error('Formato de resposta inesperado.');
    }

    const pontuacaoCredibilidade = parseInt(pontuacaoLinha.split(':')[1].trim());
    const explicacao = linhas.slice(explicacaoInicio + 1).join('\n').trim();

    // Limpar arquivos temporários
    if (imagem) await fs.unlink(imagem.path);
    if (video) await fs.unlink(video.path);

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
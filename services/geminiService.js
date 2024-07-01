const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require('fs').promises;
require("dotenv").config();
const { extractContentFromUrl } = require('./webScraper');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
Você é um assistente especializado em análise de conteúdo e detecção de notícias falsas. 
Sua tarefa é analisar o conteúdo fornecido e determinar sua credibilidade. 
Forneça uma pontuação de credibilidade de 0 a 100, onde 0 é completamente falso e 100 é completamente verdadeiro. 
Além disso, forneça uma breve explicação para sua avaliação.

Lembre-se:
1. A data atual é ${new Date().toISOString().split('T')[0]}. Qualquer conteúdo que mencione datas futuras deve ser tratado com extremo ceticismo.
2. Verifique cuidadosamente as datas mencionadas no conteúdo e compare-as com a data atual.
3. Para alegações sobre novas tecnologias ou descobertas, considere se há fontes confiáveis corroborando a informação.
4. Analise o estilo de escrita, formatação e tom do conteúdo para identificar possíveis sinais de desinformação.
5. Se o conteúdo fizer alegações extraordinárias, exija evidências extraordinárias para suportá-las.

Responda APENAS no seguinte formato: 
Pontuação de Credibilidade: [número]; 
Explicação: [sua explicação detalhada, abordando os pontos acima quando relevantes]
`;

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

async function analisarNoticia(texto, arquivos, url) {
  try {
    let parts = [];

    if (texto) {
      parts.push({ text: `Analise o seguinte texto, lembrando que a data atual é ${new Date().toISOString().split('T')[0]}: "${texto}"` });
    }

    if (url) {
      try {
        const urlContent = await extractContentFromUrl(url);
        parts.push({ text: `Analise o conteúdo da seguinte URL (${url}), lembrando que a data atual é ${new Date().toISOString().split('T')[0]}:
          Título: ${urlContent.title}
          Descrição: ${urlContent.metaDescription}
          Conteúdo: ${urlContent.bodyText}` 
        });
      } catch (error) {
        console.error('Erro ao extrair conteúdo da URL:', error);
        parts.push({ text: `Não foi possível extrair o conteúdo da URL: ${url}` });
      }
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
        parts.push({ text: `Analise a mídia acima, lembrando que a data atual é ${new Date().toISOString().split('T')[0]}.` });
      }
    }

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: parts }
      ],
      generationConfig: {
        temperature: 0.7,  
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
      systemInstruction: systemInstruction
    });

    const resposta = result.response.text();
    console.log("Resposta completa da API:", resposta);

    let pontuacaoCredibilidade = 0;
    let explicacao = "";

    const pontuacaoMatch = resposta.match(/Pontuação de Credibilidade:\s*(.*?);/i);
    const explicacaoMatch = resposta.match(/Explicação:\s*([\s\S]+)/i);

    if (pontuacaoMatch) {
      const pontuacaoStr = pontuacaoMatch[1].trim();
      if (pontuacaoStr.toLowerCase() === "não aplicável") {
        pontuacaoCredibilidade = 0;
      } else {
        pontuacaoCredibilidade = parseInt(pontuacaoStr);
      }
    }

    if (explicacaoMatch) {
      explicacao = explicacaoMatch[1].trim();
    } else {
      explicacao = resposta;
    }

    if (isNaN(pontuacaoCredibilidade)) {
      pontuacaoCredibilidade = 0;
    }

    console.log("Pontuação de Credibilidade:", pontuacaoCredibilidade);
    console.log("Explicação:", explicacao);

    return {
      pontuacaoCredibilidade,
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
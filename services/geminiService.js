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
Sua tarefa é analisar o CONTEÚDO FORNECIDO (que pode incluir texto, informações de URLs, imagens ou vídeos) e determinar sua credibilidade GERAL.
Forneça uma pontuação de credibilidade de 0 a 100, onde 0 é completamente falso e 100 é completamente verdadeiro. 
Além disso, forneça uma breve explicação para sua avaliação.

Lembre-se:
0. Considere todos os tipos de conteúdo fornecidos (texto, URL, mídia) de forma integrada para formar sua avaliação. Se instruções específicas forem dadas para analisar certos tipos de mídia, siga-as.
1. A data atual é ${new Date().toISOString().split('T')[0]}. Qualquer conteúdo que mencione datas futuras deve ser tratado com extremo ceticismo.
2. Verifique cuidadosamente as datas mencionadas no conteúdo e compare-as com a data atual.
3. Para alegações sobre novas tecnologias ou descobertas, considere se há fontes confiáveis corroborando a informação.
4. Analise o estilo de escrita, formatação e tom do conteúdo para identificar possíveis sinais de desinformação.
5. Se o conteúdo fizer alegações extraordinárias, exija evidências extraordinárias para suportá-las.

Sua resposta DEVE ser um objeto JSON válido, formatado da seguinte maneira:
{
  "pontuacaoCredibilidade": <número inteiro entre 0 e 100>,
  "explicacao": "<sua explicação detalhada, abordando os pontos relevantes. Pode incluir markdown para formatação.>"
}
Não inclua nenhum texto, comentários ou formatação fora deste objeto JSON. A resposta deve ser estritamente o JSON.
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

/**
 * Analyzes news content (text, URL, or files) using the Gemini AI model.
 * @param {string} texto - The text content of the news.
 * @param {Array<Object>} arquivos - An array of file objects (from Multer) to be analyzed.
 * @param {string} url - The URL of the news article to be analyzed.
 * @returns {Promise<Object>} An object containing the credibility score, explanation, and a boolean indicating if it's reliable.
 */
async function analisarNoticia(texto, arquivos, url) {
  try {
    // The 'parts' array will hold the different pieces of content to be sent to the AI.
    // This can include text, data from a URL, and image/video files.
    let parts = [];

    // Add text content if provided
    if (texto) {
      parts.push({ text: `Analise o seguinte texto, lembrando que a data atual é ${new Date().toISOString().split('T')[0]}: "${texto}"` });
    }

    // Add content from URL if provided
    if (url) {
      try {
        // Scrape content (title, description, body) from the given URL.
        const urlContent = await extractContentFromUrl(url);
        parts.push({ text: `Analise o conteúdo da seguinte URL (${url}), lembrando que a data atual é ${new Date().toISOString().split('T')[0]}:
          Título: ${urlContent.title}
          Descrição: ${urlContent.metaDescription}
          Conteúdo: ${urlContent.bodyText}` 
        });
      } catch (error) {
        // If URL scraping fails, inform the AI about the failure.
        console.error('Erro ao extrair conteúdo da URL:', error);
        parts.push({ text: `Não foi possível extrair o conteúdo da URL: ${url}. Analise com base nas informações disponíveis.` });
      }
    }

    // Add file content if provided
    if (arquivos && arquivos.length > 0) {
      for (let arquivo of arquivos) {
        // Convert file to base64 to be sent to the AI.
        const base64Content = await fileToBase64(arquivo.path);
        parts.push({
          inlineData: {
            mimeType: arquivo.mimetype, // e.g., 'image/jpeg'
            data: base64Content,
          },
        });
        // Add a more specific text part to prompt analysis of the preceding media in context.
        const mediaAnalysisPrompt = `A mídia (imagem/vídeo) fornecida acima está associada a uma notícia. Analise esta mídia em conjunto com qualquer outro texto ou URL que também possa ter sido fornecido como parte desta mesma notícia. Na sua explicação sobre a credibilidade geral da notícia, comente se esta mídia parece autêntica, se é relevante para o contexto da notícia (se um contexto foi fornecido), e se ela corrobora ou contradiz as informações apresentadas nos outros componentes da notícia. Considere esta análise da mídia ao determinar a pontuacaoCredibilidade geral da notícia. Lembre-se que a data atual é ${new Date().toISOString().split('T')[0]}.`;
        parts.push({ text: mediaAnalysisPrompt });
      }
    }

    // Call the Gemini AI model with the constructed parts and system instruction.
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
    let explicacao = "Erro ao processar a resposta da IA. A IA não retornou uma explicação válida."; // Default explanation

    try {
        // The AI is instructed to return JSON. This block parses the response.
        // First, remove potential markdown code block fences (```json ... ```) that the AI might add.
        const cleanedResponse = resposta.replace(/^```json\s*|```$/g, '').trim();
        const parsedResponse = JSON.parse(cleanedResponse);

        // Validate the parsed JSON structure.
        if (parsedResponse && typeof parsedResponse.pontuacaoCredibilidade === 'number' && typeof parsedResponse.explicacao === 'string') {
            pontuacaoCredibilidade = parsedResponse.pontuacaoCredibilidade;
            explicacao = parsedResponse.explicacao;
        } else {
            // If the JSON is not as expected, log an error.
            // The default 'explicacao' will be used.
            console.error("Resposta da IA não contém os campos esperados ou tipos inválidos:", parsedResponse);
        }

    } catch (parseError) {
        // If JSON parsing fails, log the error and the raw response.
        // The default 'explicacao' will be used.
        // Optionally, one could return the raw 'resposta' as 'explicacao' here if desired.
        console.error("Erro ao fazer parse da resposta JSON da IA:", parseError);
        console.error("Resposta recebida da IA:", resposta);
    }

    // Sanitize and normalize pontuacaoCredibilidade.
    // Ensure it's a number and within the 0-100 range.
    if (isNaN(pontuacaoCredibilidade) || pontuacaoCredibilidade < 0) {
        pontuacaoCredibilidade = 0;
    } else if (pontuacaoCredibilidade > 100) {
        pontuacaoCredibilidade = 100;
    }
    // Round to the nearest integer.
    pontuacaoCredibilidade = Math.round(pontuacaoCredibilidade);

    console.log("Pontuação de Credibilidade (após parse):", pontuacaoCredibilidade);
    console.log("Explicação (após parse):", explicacao);

    return {
      pontuacaoCredibilidade,
      explicacao,
      eConfiavel: pontuacaoCredibilidade >= 70, // Or your existing threshold
    };

  } catch (erro) {
    console.error('Erro detalhado ao chamar a API Gemini ou processar a resposta:', erro);
    // Check if the error is from the Gemini API itself (e.g. safety settings blocking)
    if (erro.response && erro.response.promptFeedback) {
      console.error('Feedback do prompt da API Gemini:', erro.response.promptFeedback);
      let blockReason = "A resposta foi bloqueada pela API Gemini.";
      if (erro.response.promptFeedback.blockReason) {
        blockReason += ` Motivo: ${erro.response.promptFeedback.blockReason}`;
      }
      return {
        pontuacaoCredibilidade: 0,
        explicacao: blockReason,
        eConfiavel: false,
        detalhesErro: erro.message
      };
    }
    return {
      pontuacaoCredibilidade: 0,
      explicacao: 'Erro ao analisar o conteúdo. Por favor, tente novamente.',
      eConfiavel: false,
      detalhesErro: erro.message
    };
  }
}

module.exports = { analisarNoticia };
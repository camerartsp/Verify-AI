const { analyzeNews } = require('./index');
require('dotenv').config();

async function testAnalyzeNews() {
  const url = 'https://www.hardware.com.br/noticias/apple-chatgpt-sem-custos-openai.html'; // Use um URL válido para um teste real
  try {
    const result = await analyzeNews(url);
    console.log('Resultado da Análise:', result);
  } catch (error) {
    console.error('Erro ao analisar a notícia:', error);
    process.exit(1); // Sair com um erro
  }
}

testAnalyzeNews();
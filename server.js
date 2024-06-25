const express = require('express');
const multer = require('multer');
const { analisarNoticia } = require('./services/geminiScraper');

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Define the route handler
app.post('/api/analisar', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const texto = req.body.text;
        const imagem = req.files?.image?.[0];
        const video = req.files?.video?.[0];

        // Validação básica
        if (!texto && !imagem && !video) {
            return res.status(400).json({ erro: 'É necessário fornecer pelo menos texto, imagem ou vídeo.' });
        }

        const resultado = await analisarNoticia(texto, imagem, video);

        res.json(resultado);
    } catch (error) {
        console.error('Erro detalhado:', error);
        res.status(500).json({ erro: 'Falha ao analisar o conteúdo.', detalhes: error.message });
    }
});

// Export the Express API
module.exports = app;
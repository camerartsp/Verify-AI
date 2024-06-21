const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { analisarNoticia } = require('./services/geminiScraper');

const app = express();
const porta = 3000;

app.use(express.json());
app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

app.post('/analisar', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
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

app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});
const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { analisarNoticia } = require('./services/geminiService');

const app = express();
const porta = 3000;

app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        cb(null, true);
    }
}).any();

app.post('/analisar', function(req, res) {
    upload(req, res, async function(err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ erro: 'Erro no upload de arquivo', detalhes: err.message });
        } else if (err) {
            return res.status(500).json({ erro: 'Erro desconhecido', detalhes: err.message });
        }

        try {
            const texto = req.body.text;
            const url = req.body.url;
            const arquivos = req.files;

            if (!texto && !url && (!arquivos || arquivos.length === 0)) {
                return res.status(400).json({ erro: 'É necessário fornecer pelo menos texto, URL ou mídia.' });
            }

            const resultado = await analisarNoticia(texto, arquivos, url);

            const respostaFinal = {
                pontuacaoCredibilidade: resultado.pontuacaoCredibilidade,
                explicacao: resultado.explicacao,
                eConfiavel: resultado.eConfiavel
            };

            res.json(respostaFinal);

        } catch (error) {
            console.error('Erro ao analisar o conteúdo:', error.message);
            res.status(500).json({ erro: 'Falha ao analisar o conteúdo.' });
        } finally {
            if (req.files && req.files.length > 0) {
                for (let arquivo of req.files) {
                    await fs.unlink(arquivo.path).catch(console.error);
                }
            }
        }
    });
});

app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});
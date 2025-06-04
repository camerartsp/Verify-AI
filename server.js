const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios'); // Added axios
require('dotenv').config(); // Added dotenv configuration
const { analisarNoticia } = require('./services/geminiService');

const app = express();
const porta = 3000;

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('public')); // Serve static files from the 'public' directory

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    // Specifies the destination directory for uploaded files.
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Files will be saved in the 'uploads/' directory.
    },
    // Defines the filename for uploaded files.
    // Appends the current timestamp and original file extension to ensure uniqueness.
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Multer instance configured with the defined storage and a file filter.
// .any() accepts all files that comes over the wire.
const upload = multer({ 
    storage: storage,
    fileFilter: function(req, file, cb) {
        // Basic file filter: accepts all files for now.
        // Could be expanded to validate mimetypes, e.g. only images/videos.
        cb(null, true);
    }
}).any(); // .any() allows any number of files with any field names.

/**
 * Endpoint to analyze news content.
 * Accepts POST requests with text, URL, and/or media files for analysis.
 * Uses Multer for file handling.
 */
app.post('/analisar', function(req, res) {
    // Middleware function provided by Multer to handle file uploads.
    // It processes files attached to the request and populates `req.files`.
    upload(req, res, async function(err) {
        // Handle potential errors from Multer during file upload.
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err.message);
            return res.status(500).json({ erro: 'Erro no upload de arquivo', detalhes: err.message });
        } else if (err) {
            // Handle other unexpected errors during upload.
            console.error('Unknown upload error:', err.message);
            return res.status(500).json({ erro: 'Erro desconhecido no upload', detalhes: err.message });
        }

        try {
            // Extract text, URL, and files from the request.
            // `req.body` contains text fields (text, url).
            // `req.files` is an array of file objects populated by Multer.
            const texto = req.body.text;
            const url = req.body.url;
            const arquivos = req.files; // Array of uploaded file objects

            // Validate that at least one form of content is provided.
            if (!texto && !url && (!arquivos || arquivos.length === 0)) {
                return res.status(400).json({ erro: 'É necessário fornecer pelo menos texto, URL ou mídia.' });
            }

            // Call the AI service to analyze the provided content.
            // `analisarNoticia` handles the logic of interacting with the Gemini AI.
            const resultado = await analisarNoticia(texto, arquivos, url);

            // Prepare the final response to be sent to the client.
            const respostaFinal = {
                pontuacaoCredibilidade: resultado.pontuacaoCredibilidade,
                explicacao: resultado.explicacao,
                eConfiavel: resultado.eConfiavel
            };

            res.json(respostaFinal);

        } catch (error) {
            // Catch errors from the `analisarNoticia` service or other unexpected issues.
            console.error('Erro ao analisar o conteúdo (endpoint /analisar):', error.message);
            res.status(500).json({ erro: 'Falha ao analisar o conteúdo.', detalhesErro: error.message });
        } finally {
            // Cleanup: Delete uploaded files from the server after analysis.
            // This is crucial to prevent the server from filling up with temporary files.
            if (req.files && req.files.length > 0) {
                for (let arquivo of req.files) {
                    await fs.unlink(arquivo.path).catch(console.error); // Log errors during unlink but don't crash
                }
            }
        }
    });
});

/**
 * Endpoint to fetch recent news using Google Custom Search API.
 * This acts as a proxy to avoid exposing API keys on the client-side.
 * Accepts GET requests with 'query' and 'region' parameters.
 */
app.get('/api/search-news', async (req, res) => {
    // Extract query and region from request query parameters.
    const { query, region } = req.query;

    // Retrieve Google API Key and Custom Search Engine ID from environment variables.
    // This keeps sensitive credentials secure and off the client-side.
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX; // Custom Search Engine ID

    // Validate that API key and CX are configured on the server.
    if (!apiKey || !cx) {
        console.error('Google API Key or CX not configured on server.');
        return res.status(500).json({ erro: 'Configuração do servidor incompleta para busca de notícias.' });
    }

    // Validate that 'query' and 'region' parameters are provided by the client.
    if (!query || !region) {
        return res.status(400).json({ erro: 'Parâmetros de busca "query" e "region" são obrigatórios.' });
    }

    // Construct the URL for the Google Custom Search API.
    // `q` is the search query.
    // `gl` (geographic location) is used to prioritize results from a specific country (region).
    const googleApiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&gl=${region}`;

    try {
        // Make a GET request to the Google Custom Search API using axios.
        const response = await axios.get(googleApiUrl);
        // Forward the data (search results) from Google's API back to the client.
        res.json(response.data);
    } catch (error) {
        // Handle errors from the Google API call.
        console.error('Erro ao buscar notícias do Google API:', error.response ? error.response.data : error.message);
        // Return an appropriate error status and message to the client.
        // Uses error.response.status if available, otherwise defaults to 500.
        res.status(error.response ? error.response.status : 500).json({
            erro: 'Falha ao buscar notícias do Google API.',
            detalhes: error.response ? error.response.data : error.message
        });
    }
});

// Start the Express server and listen on the defined port.
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});
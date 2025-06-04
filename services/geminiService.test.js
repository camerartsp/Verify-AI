const { analisarNoticia } = require('./geminiService');
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Import to access mockGenerateContent
const webScraper = require('./webScraper');
const fs = require('fs').promises;

// Mocking @google/generative-ai
// Access the mockGenerateContent via the imported GoogleGenerativeAI due to jest.mock hoisting
let mockGenerateContentFn;

jest.mock('@google/generative-ai', () => {
    mockGenerateContentFn = jest.fn();
    const mockGetGenerativeModel = jest.fn(() => ({
        generateContent: mockGenerateContentFn,
    }));
    return {
        GoogleGenerativeAI: jest.fn(() => ({
            getGenerativeModel: mockGetGenerativeModel,
        })),
        HarmCategory: { HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT' },
        HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE' },
    };
});

// Mocking webScraper
jest.mock('./webScraper', () => ({
    extractContentFromUrl: jest.fn(),
}));

// Mocking fs.promises
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn(),
    }
}));

describe('analisarNoticia', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockGenerateContentFn.mockReset();
        webScraper.extractContentFromUrl.mockReset();
        fs.readFile.mockReset();
        // Set default mock implementations if needed
        process.env.GEMINI_API_KEY = 'test-api-key'; // Ensure env var is set
    });

    test('Scenario 1: Successful JSON response from AI (text input)', async () => {
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ pontuacaoCredibilidade: 85, explicacao: "This is a test explanation." }) }
        });

        const result = await analisarNoticia('Some news text', null, null);
        expect(result.pontuacaoCredibilidade).toBe(85);
        expect(result.explicacao).toBe("This is a test explanation.");
        expect(result.eConfiavel).toBe(true);
    });

    test('Scenario 2: AI response is not valid JSON', async () => {
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => "This is not JSON." }
        });

        const result = await analisarNoticia('Some news text', null, null);
        expect(result.pontuacaoCredibilidade).toBe(0);
        expect(result.explicacao).toBe("Erro ao processar a resposta da IA. A IA não retornou uma explicação válida.");
        expect(result.eConfiavel).toBe(false);
    });

    test('Scenario 3a: AI response is JSON but missing pontuacaoCredibilidade', async () => {
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ explicacao: "Only explanation" }) }
        });

        const result = await analisarNoticia('Some news text', null, null);
        expect(result.pontuacaoCredibilidade).toBe(0); // Defaults to 0
        expect(result.explicacao).toBe("Only explanation");
        expect(result.eConfiavel).toBe(false);
    });

    test('Scenario 3b: AI response is JSON but missing explicacao', async () => {
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ pontuacaoCredibilidade: 70 }) }
        });

        const result = await analisarNoticia('Some news text', null, null);
        expect(result.pontuacaoCredibilidade).toBe(70);
        // Default explanation when field is missing
        expect(result.explicacao).toBe("Erro ao processar a resposta da IA. A IA não retornou uma explicação válida.");
        expect(result.eConfiavel).toBe(true);
    });

    test('Scenario 3c: AI response has incorrect type for pontuacaoCredibilidade', async () => {
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ pontuacaoCredibilidade: "not a number", explicacao: "Explanation present" }) }
        });

        const result = await analisarNoticia('Some news text', null, null);
        expect(result.pontuacaoCredibilidade).toBe(0); // Defaults to 0 due to NaN
        expect(result.explicacao).toBe("Explanation present");
        expect(result.eConfiavel).toBe(false);
    });


    test('Scenario 4: URL input (mock extractContentFromUrl)', async () => {
        webScraper.extractContentFromUrl.mockResolvedValue({
            title: 'Test Title',
            metaDescription: 'Test Desc',
            bodyText: 'Test Body'
        });
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ pontuacaoCredibilidade: 90, explicacao: "URL content is credible" }) }
        });

        const result = await analisarNoticia(null, null, 'http://example.com');
        expect(webScraper.extractContentFromUrl).toHaveBeenCalledWith('http://example.com');
        expect(result.pontuacaoCredibilidade).toBe(90);
        expect(result.explicacao).toBe("URL content is credible");
        expect(result.eConfiavel).toBe(true);
    });

    test('Scenario 4b: URL input with extractContentFromUrl failure', async () => {
        webScraper.extractContentFromUrl.mockRejectedValue(new Error('Failed to extract'));
        // AI should still be called, but with a message about extraction failure
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ pontuacaoCredibilidade: 10, explicacao: "Could not verify URL content." }) }
        });

        const result = await analisarNoticia(null, null, 'http://broken-url.com');
        expect(webScraper.extractContentFromUrl).toHaveBeenCalledWith('http://broken-url.com');
        // The parts array passed to generateContent should reflect the failure
        // This is an indirect check, the main thing is that it handles the error and proceeds
        expect(mockGenerateContentFn).toHaveBeenCalled();
        expect(result.pontuacaoCredibilidade).toBe(10);
        expect(result.explicacao).toBe("Could not verify URL content.");
        expect(result.eConfiavel).toBe(false);
    });

    test('Scenario 5: File input (mock fs.readFile)', async () => {
        fs.readFile.mockResolvedValue('dummy base64 content'); // Mocking readFile which is used by fileToBase64 internally
        mockGenerateContentFn.mockResolvedValue({
            response: { text: () => JSON.stringify({ pontuacaoCredibilidade: 75, explicacao: "File content seems okay" }) }
        });

        const mockFiles = [{ path: 'dummy/path/file.jpg', mimetype: 'image/jpeg' }];
        const result = await analisarNoticia(null, mockFiles, null);

        expect(fs.readFile).toHaveBeenCalledWith(mockFiles[0].path);
        expect(result.pontuacaoCredibilidade).toBe(75);
        expect(result.explicacao).toBe("File content seems okay");
        expect(result.eConfiavel).toBe(true);
    });

    test('Gemini API call failure', async () => {
        mockGenerateContentFn.mockRejectedValue(new Error("Gemini API Error"));
        const result = await analisarNoticia('Some text', null, null);
        expect(result.pontuacaoCredibilidade).toBe(0);
        expect(result.explicacao).toBe('Erro ao analisar o conteúdo. Por favor, tente novamente.');
        expect(result.eConfiavel).toBe(false);
        expect(result.detalhesErro).toBe("Gemini API Error");
    });
});

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = 3000;



app.use(cors());
app.use(express.json());

// Validar e configurar a API do Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ ERRO: GEMINI_API_KEY não encontrada. Verifique seu arquivo .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // <-- Aqui tava dando erro no nome do model
    generationConfig: {
        responseMimeType: "application/json",
    },
});

console.log('✅ Cliente Gemini inicializado com sucesso.');

app.post('/consulta', async (req, res) => {
    console.log('Recebida nova requisição em /consulta...');
    try {
        const { perguntaUsuario } = req.body;

        if (!perguntaUsuario) {
            console.log('Requisição rejeitada: Nenhuma pergunta fornecida.');
            return res.status(400).json({ error: 'O campo perguntaUsuario é obrigatório.' });
        }
        
        console.log(`Pergunta recebida: "${perguntaUsuario}"`);

        const prompt = `
            Você é uma assistente chamada Clara. Sua tarefa é responder à pergunta do usuário.
            Sua resposta DEVE ser um objeto JSON válido contendo três chaves: "titulo", "resumo" e "recomendacao".
            Não inclua nenhum texto ou formatação fora do objeto JSON.

            Pergunta do usuário: "${perguntaUsuario}"
        `;

        console.log('Enviando prompt para o Gemini...');
        const result = await model.generateContent(prompt);
        const response = result.response;
        const responseText = response.text();

        console.log('Resposta JSON recebida do Gemini.');
        
        const responseObject = JSON.parse(responseText);
        res.json(responseObject);

    } catch (error) {
        console.error("❌ Erro no endpoint /consulta:", error);
        res.status(500).json({
            titulo: "Erro Interno",
            resumo: "Desculpe, ocorreu um erro inesperado ao tentar processar sua pergunta.",
            recomendacao: "Por favor, tente novamente mais tarde."
        });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor da Clara está no ar e rodando em http://localhost:${port}`);
});


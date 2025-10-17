import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import net from 'net'; // testa se a porta está livre antes de iniciar
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const DEFAULT_PORT = 3000;

const requestedPort = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

app.use(cors());
app.use(express.json());

// Servir o ícone via rota /icons/icone.png (aponta para assets/icons/icone.png)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get('/icons/icone.png', (req, res) => {
    const iconPath = path.join(__dirname, 'assets', 'icons', 'icone.png');
    res.sendFile(iconPath, (err) => {
        if (err) {
            console.error('Erro ao servir /icons/icone.png:', err);
            res.status(404).end();
        }
    });
});

// Validar e configurar a API do Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error(' ERRO: GEMINI_API_KEY não encontrada. Verifique seu arquivo .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // <-- Aqui tava dando erro no nome do model
    generationConfig: {
        responseMimeType: "application/json",
    },
});

console.log(' Cliente Gemini inicializado com sucesso.');

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
        console.error(" Erro no endpoint /consulta:", error);
        res.status(500).json({
            titulo: "Erro Interno",
            resumo: "Desculpe, ocorreu um erro inesperado ao tentar processar sua pergunta.",
            recomendacao: "Por favor, tente novamente mais tarde."
        });
    }
});

// Iniciar o servidor
function isPortFree(port) {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', (err) => {
                // EADDRINUSE -> porta ocupada
                resolve(false);
            })
            .once('listening', () => {
                tester.close();
                resolve(true);
            })
            .listen(port, '0.0.0.0');
    });
}

async function findAvailablePort(startPort, maxAttempts = 50) {
    let port = startPort;
    for (let i = 0; i < maxAttempts; i++) {
        const free = await isPortFree(port);
        if (free) return port;
        port += 1;
    }
    throw new Error(`Nenhuma porta disponível encontrada começando em ${startPort}`);
}

(async () => {
    try {
        const port = await findAvailablePort(requestedPort, 100);
        app.listen(port, () => {
            if (port !== requestedPort) {
                console.log(` Porta ${requestedPort} estava ocupada — inicializado em http://localhost:${port} (porta alternativa)`);
            } else {
                console.log(` Servidor da Clara está no ar e rodando em http://localhost:${port}`);
            }
        });
    } catch (err) {
        console.error(' Erro ao encontrar porta disponível:', err);
        process.exit(1);
    }
})();


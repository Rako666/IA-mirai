//tout les liens pour adapté au site
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { systemPrompt } from './context.js';
import { retrieveRelevantChunks } from './utils/retrieval.js';

//on vas récuprer le fichier .env
dotenv.config();

//instanciations d'une application express 
const app = express();

//midddleware on vas interpreter pour permettre la communication  
//autoriser le frontend à communiquer avec le serveur
app.use(cors());
//permet de parser les requetes en json
app.use(express.json());

//initialiser la sdk de gemini 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//communication avec l'ia
//post pour poster 
app.post('/api/chat', async (req, res) => {
  try {
    //selon chatgpt on utiliser {} pour la déstructuration en gros on regarde
    //req.body et on vas choisir message
    const { history } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({ error: "L'historique est requis." });
    }

    // on récupère la dernière question de l'utilisateur pour faire la recherche RAG
    const lastMessage = history[history.length - 1];
    const userQuestion = lastMessage.parts?.[0]?.text || lastMessage.text || '';

    // on transforme la question en vecteur (embedding)
    const embedResponse = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: userQuestion,
      config: {
        taskType: 'RETRIEVAL_QUERY' // différent de RETRIEVAL_DOCUMENT utilisé à l'indexation
      }
    });
    const queryEmbedding = embedResponse.embeddings[0].values;

    // on récupère les chunks les plus pertinents dans notre base de connaissances
    const relevantChunks = await retrieveRelevantChunks(queryEmbedding, 4);

    // on construit un bloc de texte à partir des chunks trouvés
    const retrievedContext = relevantChunks
      .map(c => `[Source: ${c.source}]\n${c.text}`)
      .join('\n\n---\n\n');

    // on enrichit le system prompt d'origine avec ce contexte récupéré
    const enrichedSystemPrompt = `${systemPrompt}

Voici des extraits de documents pertinents pour répondre à la question de l'utilisateur :

${retrievedContext}

Réponds en te basant en priorité sur ces extraits. Si l'information n'y figure pas, dis-le clairement plutôt que d'inventer.`;

    // Envoi du prompt à Gemini
    const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: history,
          config: {
            systemInstruction: enrichedSystemPrompt
          }
    });

    // Renvoi de la réponse au front-end 
    // res.json indique un code http "200" donc un sucées
    //response.text est lapropriéter sdk pour récuperer le text de la réponse de l'ia
    res.json({ reply: response.text });
  } catch (error) {
    console.error('Erreur backend Gemini:', error);
    res.status(500).json({ error: 'Erreur lors de la communication avec Gemini.' });
  }
});

//pour lancer le serveur sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
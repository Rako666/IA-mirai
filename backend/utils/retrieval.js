import fs from 'fs';
import path from 'path';
import { cosineSimilarity } from './similarity.js';

const EMBEDDINGS_FILE = path.join(process.cwd(), 'embeddings.json');

// on charge le fichier une seule fois, au démarrage du serveur
// (pas à chaque requête, sinon c'est trop lent)
let knowledgeBase = [];
try {
  knowledgeBase = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf-8'));
  console.log(`Base de connaissances chargée : ${knowledgeBase.length} chunks.`);
} catch (err) {
  console.warn("Aucun embeddings.json trouvé — lance d'abord node index-document.js");
}

async function retrieveRelevantChunks(queryEmbedding, topK = 4) {
  const scored = knowledgeBase.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

export { retrieveRelevantChunks };
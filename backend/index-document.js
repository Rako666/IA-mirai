//les liens
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { PDFParse } from 'pdf-parse';
import { chunkText } from './utils/chunking.js';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_FILE = path.join(process.cwd(), 'embeddings.json');

async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy(); // libère la mémoire utilisée par le parseur
  }
}

async function main() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.pdf'));

  let allChunks = [];
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Extraction du texte de ${file}...`);
    const text = await extractTextFromPdf(filePath);
    const chunks = chunkText(text);
    chunks.forEach((chunk, i) => {
      allChunks.push({
        id: `${file}-${i}`,
        source: file,
        text: chunk
      });
    });
  }

  console.log(`${allChunks.length} chunks trouvés dans ${files.length} fichiers.`);

  if (allChunks.length === 0) {
    console.log("Aucun chunk à indexer, arrêt du script.");
    return;
  }

  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: allChunks.map(c => c.text),
    config: {
      taskType: 'RETRIEVAL_DOCUMENT'
    }
  });

  allChunks = allChunks.map((chunk, i) => ({
    ...chunk,
    embedding: response.embeddings[i].values
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allChunks, null, 2));
  console.log(`Embeddings sauvegardés dans ${OUTPUT_FILE}`);
}

main().catch(console.error);
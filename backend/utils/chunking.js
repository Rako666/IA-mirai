function chunkText(text, maxWords = 250) {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const chunks = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/);
    if (words.length <= maxWords) {
      chunks.push(paragraph.trim());
    } else {
      for (let i = 0; i < words.length; i += maxWords) {
        chunks.push(words.slice(i, i + maxWords).join(' '));
      }
    }
  }
  return chunks;
}

export { chunkText };
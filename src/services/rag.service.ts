import OpenAI from "openai";
import { AppDataSource } from "../db";
import { DocumentChunk } from "../entities/DocumentChunk.entity";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const ragService = {
  /**
   * Generate an embedding using OpenAI's text-embedding-3-small
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Replace newlines to improve performance as recommended by OpenAI in some docs
    const cleanedText = text.replace(/\n/g, " ");

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: cleanedText,
    });

    return response.data[0].embedding;
  },

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  },

  /**
   * Search for similar documents using pgvector
   */
  async searchSimilarDocuments(
    query: string,
    limit: number = 5
  ): Promise<DocumentChunk[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const embeddingVector = JSON.stringify(queryEmbedding);

    // Native pgvector search using <-> operator (L2 distance) or <=> (cosine distance)
    // For normalized vectors (like OpenAI's), L2 and Cosine sort order is the same.
    // We use <-> (L2) as it's generally most supported.
    const chunks = await AppDataSource.query(
      `SELECT * FROM document_chunks ORDER BY embedding <-> $1 LIMIT $2`,
      [embeddingVector, limit]
    );

    return chunks;
  },

  /**
   * Store a document chunk
   */
  async storeChunk(content: string, metadata: any) {
    const embedding = await this.generateEmbedding(content);

    const chunk = new DocumentChunk();
    chunk.content = content;
    chunk.metadata = metadata;
    // Cast to any because TypeORM vector type is string really, but we pass array/string
    // Postgres driver usually handles JSON array to vector conversion automatically
    chunk.embedding = JSON.stringify(embedding) as any;

    await AppDataSource.getRepository(DocumentChunk).save(chunk);
    return chunk;
  },
};

import { embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const documentEmbeddingModel = google.textEmbeddingModel(
  'gemini-embedding-001',
);

const queryEmbeddingModel = google.textEmbeddingModel('gemini-embedding-001');

const DIMENSIONS = 768;

export async function generateEmbedding(text: string): Promise<number[]> {
  const input = text.replace(/\s+/g, ' ').trim();

  if (!input) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const { embedding } = await embed({
    model: queryEmbeddingModel,
    value: input,
    providerOptions: {
      google: {
        outputDimensionality: DIMENSIONS,
        taskType: 'RETRIEVAL_QUERY',
      },
    },
  });

  console.log('Query dimensions:', embedding.length);

  if (embedding.length !== DIMENSIONS) {
    throw new Error(
      `Expected ${DIMENSIONS} query dimensions, received ${embedding.length}`,
    );
  }

  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];

  const inputs = texts.map((text) => text.replace(/\s+/g, ' ').trim());

  if (inputs.some((text) => !text)) {
    throw new Error('Document chunks cannot contain empty text');
  }

  const { embeddings } = await embedMany({
    model: documentEmbeddingModel,
    values: inputs,
    providerOptions: {
      google: {
        outputDimensionality: DIMENSIONS,
        taskType: 'RETRIEVAL_DOCUMENT',
      },
    },
  });

  console.log('Document dimensions:', embeddings[0]?.length);

  if (embeddings.some((embedding) => embedding.length !== DIMENSIONS)) {
    throw new Error('Google returned an unexpected embedding dimension');
  }

  return embeddings;
}

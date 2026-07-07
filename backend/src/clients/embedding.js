import { pipeline } from '@xenova/transformers'

const defaultEmbeddingModel = 'Xenova/bge-small-en-v1.5'

let extractorPromise

export function getConfiguredEmbeddingModel() {
  return process.env.EMBEDDING_MODEL ?? defaultEmbeddingModel
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', getConfiguredEmbeddingModel())
  }

  return extractorPromise
}

export async function embedText(text) {
  const extractor = await getExtractor()
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  })

  return Array.from(output.data)
}

import { GoogleGenAI } from '@google/genai'
import { getRequiredEnv } from '../utils/env.js'

let geminiClient

export function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: getRequiredEnv('GEMINI_API_KEY'),
    })
  }

  return geminiClient
}

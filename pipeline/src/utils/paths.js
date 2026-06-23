import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url))

export const pipelineDirectory = path.resolve(sourceDirectory, '..', '..')
export const fredOutputDirectory = path.join(
  pipelineDirectory,
  'data',
  'fred',
)
export const fredCatalogPath = path.join(
  fredOutputDirectory,
  'national-state-series.jsonl',
)
export const temporaryFredCatalogPath = `${fredCatalogPath}.tmp`
export const fredSummaryPath = path.join(
  fredOutputDirectory,
  'national-state-summary.json',
)

import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  fredCatalogPath,
  fredOutputDirectory,
  fredSummaryPath,
  pipelineDirectory,
  temporaryFredCatalogPath,
} from './paths.js'

async function writeJsonLine(stream, value) {
  if (stream.write(`${JSON.stringify(value)}\n`)) {
    return
  }

  await new Promise((resolve) => {
    stream.once('drain', resolve)
  })
}

async function closeStream(stream) {
  await new Promise((resolve, reject) => {
    stream.end((error) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

export async function removeTemporaryCatalog() {
  await rm(temporaryFredCatalogPath, { force: true })
}

export async function writeFredCatalog(
  seriesById,
  reportedScopeCounts,
  fetchedScopeCounts,
) {
  await mkdir(fredOutputDirectory, { recursive: true })
  await removeTemporaryCatalog()

  const stream = createWriteStream(temporaryFredCatalogPath, {
    encoding: 'utf8',
  })
  const records = [...seriesById.values()].sort((left, right) =>
    left.seriesId.localeCompare(right.seriesId),
  )

  try {
    for (const record of records) {
      await writeJsonLine(stream, record)
    }
  } finally {
    await closeStream(stream)
  }

  await rm(fredCatalogPath, { force: true })
  await rename(temporaryFredCatalogPath, fredCatalogPath)

  const overlapCount = records.filter((record) => record.scopes.length > 1).length
  const summary = {
    generatedAt: new Date().toISOString(),
    reportedScopeCounts,
    fetchedScopeCounts,
    uniqueSeriesCount: records.length,
    overlapCount,
    catalogPath: path.relative(pipelineDirectory, fredCatalogPath),
  }

  await writeFile(
    fredSummaryPath,
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  )

  return summary
}

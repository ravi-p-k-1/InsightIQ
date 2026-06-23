import { fredRequestsPerMinute } from '../src/clients/fred.js'
import {
  fetchFredCatalog,
  getFredScopeCounts,
  verifyFredGeographyTypeTags,
} from '../src/services/fredCatalog.js'
import {
  removeTemporaryCatalog,
  writeFredCatalog,
} from '../src/utils/catalogWriter.js'
import {
  fredCatalogPath,
  fredSummaryPath,
} from '../src/utils/paths.js'

const countOnly = process.argv.includes('--count-only')

async function main() {
  console.log(
    `FRED request limit: ${fredRequestsPerMinute} requests per minute`,
  )

  await verifyFredGeographyTypeTags()
  const reportedScopeCounts = await getFredScopeCounts()

  console.log(
    `National series reported by FRED: ${reportedScopeCounts.national}`,
  )
  console.log(`State series reported by FRED: ${reportedScopeCounts.state}`)

  if (countOnly) {
    return
  }

  const { seriesById, fetchedScopeCounts } = await fetchFredCatalog()
  const summary = await writeFredCatalog(
    seriesById,
    reportedScopeCounts,
    fetchedScopeCounts,
  )

  console.log(`National series retrieved: ${fetchedScopeCounts.national}`)
  console.log(`State series retrieved: ${fetchedScopeCounts.state}`)
  console.log(`Unique national/state series stored: ${summary.uniqueSeriesCount}`)
  console.log(`Series present in both scopes: ${summary.overlapCount}`)
  console.log(`Catalog: ${fredCatalogPath}`)
  console.log(`Summary: ${fredSummaryPath}`)
}

main().catch(async (error) => {
  await removeTemporaryCatalog().catch(() => {})
  console.error(error.message)
  process.exitCode = 1
})

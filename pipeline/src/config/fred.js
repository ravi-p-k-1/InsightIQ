export const fredApiBaseUrl = 'https://api.stlouisfed.org/fred'
export const fredPageSize = 1000
export const fredMaxAttempts = 5
export const defaultFredRequestsPerMinute = 60

export const fredCatalogScopes = [
  {
    id: 'national',
    tags: ['usa', 'nation'],
  },
  {
    id: 'state',
    tags: ['usa', 'state'],
  },
]

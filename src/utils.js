const fetch = require('node-fetch')
const CONFIG = require('./config')
const { retryError } = require('./error')

// generic contentful request wrapper (for retries)
const request = async (fn, opts = {}) => {
  const { retry } = opts
  for (let i = 0; i <= retry; i++) {
    const r = await fn()
    if (r.status === 429) {
      // fallback to 200 ms
      const wait = parseInt(r.headers.get('x-contentful-ratelimit-reset')) || 200
      await new Promise(resolve => setTimeout(resolve, wait + 1))
    } else {
      return r.json()
    }
  }
}

const parseQuery = (theQuery) => {
  const query = theQuery.replace(/\s/g, ' ')
  const name = query.split('Collection')[0].split(' ').pop() + 'Collection'
  const stuff = query.split('[')[1].split(']')[0].split('\\"').join('"')
  const ids = JSON.parse(`[${stuff}]`)
  return { name, ids }
}

/**
 * Makes a CDA request to contentful
 * @param {String} url - The URL for the request
 * @param {Object} opts The individual options (passed to fetch)
 * @returns
 */
module.exports.cda = async (params = {}, opts = {}) => {
  const { isPreview, space, env, key, retry = CONFIG.retry, failSilently } = opts
  const queryStr = Object.keys(params).map(key => `${key}=${params[key]}`).join('&')
  const r = await request(() => fetch(`https://${isPreview ? 'preview' : 'cdn'}.contentful.com/spaces/${space}/environments/${env}/entries?access_token=${key}&${queryStr}`), { retry })
  if (r) {
    return r
  }

  // never worked, fail
  if (failSilently) {
    return {
      total: 0,
      limit: 0,
      skip: 0,
      items: []
    }
  }

  throw new Error(retryError(retry))
}

/**
 * Makes a request to Contentful's GraphQL service.
 * @param {String} url The URL to make the request
 * @param {String} query The query string (GraphQL)
 * @returns
 */
module.exports.graphql = async (query = '', opts = {}) => {
  const { key, space, env, retry = CONFIG.retry, failSilently } = opts

  const res = await request(() => fetch(`https://graphql.contentful.com/content/v1/spaces/${space}/environments/${env}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({ query })
  }), { retry })

  // success
  if (res) {
    return res
  }

  // fail silent
  if (failSilently) {
    const queryName = parseQuery(query).name
    return {
      data: {
        [queryName]: {
          items: []
        }
      }
    }
  }

  // fail
  throw new Error(retryError(retry))
}

module.exports.getPages = ({ skip = 0, limit, total, max }) => {
  // evaluated total (remove skip from total)
  const evalTotal = total - skip
  // if less than 0, make it 0
  const realTotal = evalTotal > 0 ? evalTotal : 0
  // if realTotal is more than limit, use limit
  const resultSize = limit && realTotal > limit ? limit : realTotal
  return Math.ceil((resultSize) / max)
}

module.exports.parseQuery = parseQuery

/**
 * Converts the name to the GraphQL name.
 * @param {String} name The name to convert.
 * @returns
 */
module.exports.convertTypeToGraph = (name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`

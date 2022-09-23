import fetch from 'node-fetch'

// some globals
// limit from Contentful
const CDA_MAX = 1000
const CDA_FILTER = [
  'select', // only select IDs, select is powered by GraphQL
  'skip', // unsupported for now
  'limit' // always grab all of it
]

/**
 * Makes a CDA request to contentful
 * @param {String} url - The URL for the request
 * @param {Object} opts The individual options (passed to fetch)
 * @returns 
 */
const cda = async (url = '', opts = {}) => {
  const res = await fetch(url, opts).then(r => r.json())
  return res
}

/**
 * Makes a request to Contentful's GraphQL service.
 * @param {String} url The URL to make the request
 * @param {String} query The query string (GraphQL)
 * @returns 
 */
const graphql = async (url, key, query) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({ query })
  }).then(r => r.json())

  return res
}

/**
 * Converts the name to the GraphQL name.
 * @param {String} name The name to convert.
 * @returns 
 */
const convertTypeToGraph = (name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`

class Client {
  constructor (config={}) {
    this.config = {
      space: '',
      env: 'master',
      key: '',
      previewKey: '',
      ...config
    }
    // @TODO: Add errors and warnings for missing info
  }

  async fetch (query, select, isPreview) {
    const { space, key, previewKey, env } = this.config
    const actualKey = isPreview ? previewKey : key

    // Error handlings
    if (!query.content_type) {
      throw new Error('The "content_type" property is required.')
    }

    // convert the query to a string (with some "cleaning")
    const queryStr = Object.keys(query).filter(key => !CDA_FILTER.includes(key)).map(key => `${key}=${query[key]}`).join('&')
    
    // get your "common" url
    const url = `https://${isPreview ? 'preview' : 'cdn'}.contentful.com/spaces/${space}/environments/${env}/entries?access_token=${actualKey}&select=sys.id&include=0&${queryStr}`

    // figure out how many pages you need
    const aggregated = await cda(`${url}&limit=0`)
    const { total } = aggregated
    const pages =  Math.ceil(total / CDA_MAX)

    // setup the paginated placeholder
    // weird hack to just make it look correct
    aggregated.limit = aggregated.total

    console.log('agg', aggregated)
    console.log('pages', pages)

    // loop through all the pages and get everything
    for (let i = 0; i <= pages; i++) {
      const ret = await cda(`${url}&limit=${CDA_MAX}&skip=${i * CDA_MAX}`)
      aggregated.items.push(...ret.items)
    }
    
    // finally, get the selected stuff with graphql
    const graphStr = `
    query {
      ${query.content_type}Collection(preview: ${isPreview ? 'true' : 'false'}, where: {
        sys: {
          id_in: [${aggregated.items.map(e => JSON.stringify(e.sys.id))}]
        }
      }) {
        items ${select}
      }
    }
    `
    console.log('query', graphStr)
    const all = await graphql(`https://graphql.contentful.com/content/v1/spaces/${space}/environments/${env}`, actualKey, graphStr)

    return all
  }
}

export default (config = {}) => {
  return new Client(config)
}

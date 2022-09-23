const { cda, graphql, getPages } = require("./utils")

// some globals
// limit from Contentful
const CDA_MAX = 1000
const CDA_FILTER = [
  'select', // only select IDs, select is powered by GraphQL
  'skip', // manage the skip from the total
  'limit' // always grab all of it
]

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

  async fetch (query, select, opts={}) {
    const { space, key, previewKey, env } = this.config
    const { isPreview, verbose } = opts
    const actualKey = isPreview ? previewKey : key
    const { content_type, skip = 0, limit } = query

    // Error handlings
    if (!content_type) {
      throw new Error('The "content_type" property is required.')
    }

    // convert the query to a string (with some "cleaning")
    const queryStr = Object.keys(query).filter(key => !CDA_FILTER.includes(key)).map(key => `${key}=${query[key]}`).join('&')
    
    // get your "common" url
    const url = `https://${isPreview ? 'preview' : 'cdn'}.contentful.com/spaces/${space}/environments/${env}/entries?access_token=${actualKey}&select=sys.id&include=0&${queryStr}`

    // figure out how many pages you need
    const aggregated = await cda(`${url}&limit=0`)
    const { total } = aggregated
    // remove skip to offset the pages
    const pages =  getPages({ max: CDA_MAX, total, skip, limit })

    // setup the paginated placeholder
    // weird hack to just make it look correct
    aggregated.limit = limit || aggregated.total
    aggregated.skip = skip || aggregated.skip

    // loop through all the pages and get everything
    for (let i = 0; i < pages; i++) {
      // total = 100
      // max = 20
      // limit = 48
      // 1: limit = 20
      // 2: limit = 20, skip = 20
      // 3: limit = 8, skip = 20
      const tempSkip = skip + (i * CDA_MAX)
      const tempLimit = limit && aggregated.items.length + CDA_MAX > limit ? limit - aggregated.items.length : CDA_MAX
      const ret = await cda(`${url}&limit=${tempLimit}&skip=${tempSkip}`)
      aggregated.items.push(...ret.items)
    }

    console.log('aggregated', aggregated)
    
    // finally, get the selected stuff with graphql
    const queryName = `${content_type}Collection`
    const graphStr = `query {
      ${queryName}(preview: ${isPreview ? 'true' : 'false'}, where: {
        sys: {
          id_in: [${aggregated.items.map(e => JSON.stringify(e.sys.id))}]
        }
      }) {
        items ${select}
      }
    }`

    const all = await graphql(`https://graphql.contentful.com/content/v1/spaces/${space}/environments/${env}`, actualKey, graphStr)

    return verbose ? all : all.data[queryName].items
  }
}

module.exports = (config = {}) => {
  return new Client(config)
}

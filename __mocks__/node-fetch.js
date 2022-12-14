// mocking the service
const utils = require('../src/utils')

/*
`https://${isPreview ? 'preview' : 'cdn'}.contentful.com/spaces/${space}/environments/${env}/entries?access_token=${actualKey}&select=sys.id&include=0&${queryStr}`
`https://graphql.contentful.com/content/v1/spaces/${space}/environments/${env}`
*/

const createRandomCdaEntry = (index) => ({
  sys: { id: index },
  fields: { index }
})

// create 5000 entries
const db = Array(5000).fill().map((_, idx) => createRandomCdaEntry(idx))

const normalizedResponse = (ret) => Promise.resolve({
  status: 200,
  json: () => ret
})

module.exports = (url, opts = {}) => {
  const isGraphql = url.includes('graph')

  if (global.failRate) {
    global.failRate--
    return {
      status: 429,
      headers: {
        // just return 1 ms
        get: () => '1'
      }
    }
  }

  if (isGraphql) {
    const theQuery = JSON.parse(opts.body).query
    const { name, ids } = utils.parseQuery(theQuery)

    // data[queryName].items
    return normalizedResponse({
      data: {
        [name]: {
          items: ids.map(ids => ({
            title: ids
          }))
        }
      }
    })
  } else {
    const queryStr = url.split('?')[1]
    const params = !queryStr
      ? {}
      : queryStr.split('&').reduce((all, current) => {
        const split = current.split('=')
        all[split[0]] = split[1]
        return all
      }, {})

    const skip = parseInt(params.skip) || 0
    // this got annoying because parseInt('0') always evaluates false...
    const limit = parseInt(params.limit) || (params.limit ? 0 : 100)

    return normalizedResponse({
      total: db.length,
      limit,
      skip,
      items: db.slice(skip, skip + limit)
    })
  }
}

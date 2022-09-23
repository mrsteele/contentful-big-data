// mocking the service

/*
`https://${isPreview ? 'preview' : 'cdn'}.contentful.com/spaces/${space}/environments/${env}/entries?access_token=${actualKey}&select=sys.id&include=0&${queryStr}`
`https://graphql.contentful.com/content/v1/spaces/${space}/environments/${env}`
*/

const createRandomStr = () => (Math.random() + 1).toString(36).substring(12)
const createRandomCdaEntry = (index) => ({
  sys: { id: createRandomStr()},
  fields: { index }
})

// create 5000 entries
const db = Array(5000).fill().map((_, idx) => createRandomCdaEntry(idx))

const normalizedResponse = (ret) => Promise.resolve({
  json: () => ret
})

module.exports = (url) => {
  const isGraphql = url.includes('graph')

  if (isGraphql) {
    // ...
  } else {
    const queryStr = url.split('?')[1]
    const params = !queryStr ? {} : queryStr.split('&').reduce((all, current) => {
      const split = current.split('=')
      all[split[0]] = split[1]
      return all
    }, {})

    const skip = parseInt(params.skip) || 0
    const limit = parseInt(params.limit) || 100

    return normalizedResponse({
      total: db.length,
      limit,
      skip,
      items: db.slice(skip, skip + limit)
    })
  }
}

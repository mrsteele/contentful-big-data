const fetch = require('node-fetch')

/**
 * Makes a CDA request to contentful
 * @param {String} url - The URL for the request
 * @param {Object} opts The individual options (passed to fetch)
 * @returns 
 */
 module.exports.cda = async (url = '', opts = {}) => {
  const res = await fetch(url, opts).then(r => r.json())
  return res
}

/**
 * Makes a request to Contentful's GraphQL service.
 * @param {String} url The URL to make the request
 * @param {String} query The query string (GraphQL)
 * @returns 
 */
module.exports.graphql = async (url, key, query) => {
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

module.exports.getPages = ({ skip=0, limit, total, max }) => {
  // evaluated total (remove skip from total)
  const evalTotal = total - skip
  // if less than 0, make it 0 
  const realTotal = evalTotal > 0 ? evalTotal : 0
  // if realTotal is more than limit, use limit
  const resultSize = limit && realTotal > limit ? limit : realTotal
  return Math.ceil((resultSize) / max)
}

/**
 * Converts the name to the GraphQL name.
 * @param {String} name The name to convert.
 * @returns 
 */
module.exports.convertTypeToGraph = (name) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`

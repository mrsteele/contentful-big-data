/* eslint-disable camelcase */
const { cda, graphql, getPages } = require('./utils')
const { spaceKeyError, contentTypeError } = require('./error')
const CONFIG = require('./config')

class Client {
  constructor (config = {}) {
    this.config = {
      space: '',
      env: 'master',
      key: '',
      previewKey: '',
      ...config
    }

    // basic error handling...
    const { space, key, previewKey } = this.config
    if (!space || (!key && !previewKey)) {
      throw new Error(spaceKeyError)
    }
  }

  async fetch (query, select, opts = {}) {
    const { space, key, previewKey, env, retry, failSilently } = this.config
    const { isPreview, verbose, retry: retryOpts, failSilently: failSilentlyOpts } = opts
    // pull out select (not used here)
    const { content_type, skip = 0, limit = 0, ...queryRest } = query

    // Error handlings
    if (!content_type) {
      throw new Error(contentTypeError)
    }

    // get your "common" url
    const commonProps = {
      // skip, limit were destructed out
      ...queryRest,
      content_type,
      select: 'sys.id', // only need the ids
      include: 0 // only need the root entry
    }

    const commonOpts = {
      isPreview,
      space,
      env,
      key: isPreview ? previewKey : key,
      retry: retryOpts ?? retry,
      failSilently: failSilentlyOpts ?? failSilently
    }

    // figure out how many pages you need
    // @TODO - Try to use this as page 1
    const aggregated = await cda({ ...commonProps, limit: 0 }, commonOpts)
    const { total } = aggregated
    // remove skip to offset the pages
    const pages = getPages({ max: CONFIG.cdaMax, total, skip, limit })

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
      const tempSkip = skip + (i * CONFIG.cdaMax)
      const tempLimit = limit && aggregated.items.length + CONFIG.cdaMax > limit ? limit - aggregated.items.length : CONFIG.cdaMax
      const ret = await cda({ ...commonProps, limit: tempLimit, skip: tempSkip }, commonOpts)
      aggregated.items.push(...ret.items)
    }

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

    const all = await graphql(graphStr, commonOpts)

    return verbose ? all : all.data[queryName].items
  }
}

module.exports = (config = {}) => {
  return new Client(config)
}

module.exports.CBD = Client

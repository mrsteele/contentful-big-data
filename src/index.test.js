const all = require('./utils')
const spy = jest.spyOn(all, 'cda')

// now we can safely call this
const CBD = require('.')


afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks();
})

describe('CBD', () => {
  describe('constructor', () => {
    test('default', () => {
      expect(typeof CBD).toBe('function')
    })

    test('default instance', () => {
      const cbd = CBD({})
      expect(cbd instanceof CBD.CBD).toBe(true)
    })

    test('constructor results', () => {
      expect(CBD({}).constructor.name).toBe('Client')
    })
  })

  // test('missing requirements', () => {

  // })

  describe('fetch', () => {
    const cbd = CBD({})

    test('missing content_type', async () => {
      await expect(cbd.fetch({ not_content_type: 't' }, '{ title }')).rejects.toThrow('The "content_type" property is required.')
    })

    test('default', async () => {
      const results = await cbd.fetch({ content_type: 't' }, `{
        title
      }`)
      expect(results.length).toBe(5000)
    })

    test('default (with limit)', async () => {
      const results = await cbd.fetch({ content_type: 't', limit: 1 }, `{
        title
      }`)
      expect(results.length).toBe(1)
    })

    test('default (with larger limit)', async () => {
      const results = await cbd.fetch({ content_type: 't', limit: 10000 }, `{
        title
      }`)
      expect(results.length).toBe(5000)
    })

    test('select should be ignored', async () => {
      const results = await cbd.fetch({ content_type: 't', select: 'all,these,things' }, `{
        title
      }`)
      expect(results.length).toBe(5000)
      expect(spy).toHaveBeenCalled()

      const lastArgs = spy.mock.calls[spy.mock.calls.length - 1]
      expect(lastArgs[0].select).toBe('sys.id')
    })

    test('other fields should pass in', async () => {
      const results = await cbd.fetch({ content_type: 't', 'fields.test': 'ok', select: 'all,these,things' }, `{
        title
      }`)
      expect(results.length).toBe(5000)
      expect(spy).toHaveBeenCalled()

      const lastArgs = spy.mock.calls[spy.mock.calls.length - 1]
      expect(lastArgs[0]['fields.test']).toBe('ok')
    })

    // test('honors limits < 100', async () => {
    //   const query = {
    //     content_type: 'test',
    //     limit: 5
    //   }

    //   const res = await cbd.fetch(query, `{
    //     title
    //   }`)

    //   expect(res.length).toBe(query.limit)
    // })
  })
})

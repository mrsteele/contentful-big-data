const CBD = require('.')

describe('CBD', () => {
  describe('constructor', () => {
    test('default', () => {
      expect(typeof CBD).toBe('function');
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

    test('default', async () => {
      const results = await cbd.fetch({ content_type: 't', limit: 1 }, `{
        title
      }`)
      expect(results.length).toBe(1);
    })
  
    test('missing content_type', async () => {
      await expect(cbd.fetch({ not_content_type: 't' }, `{ title }`)).rejects.toThrow('The "content_type" property is required.')
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

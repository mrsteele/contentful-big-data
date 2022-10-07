// @NOTE - cdaSpyOn BEFORE the dependent imports
const all = require('./utils')
const cdaSpy = jest.spyOn(all, 'cda')

// now we can safely call this
const CBD = require('.')

const CBDConstructorErrorStr = '"space" and at least "key" or "previewKey" are required.'

afterEach(() => {
  // restore the cdaSpy created with spyOn
  jest.restoreAllMocks()
})

describe('CBD', () => {
  describe('constructor', () => {
    test('default', () => {
      expect(typeof CBD).toBe('function')
    })

    test('default instance', () => {
      const cbd = CBD({ space: 'a', key: 'a' })
      expect(cbd instanceof CBD.CBD).toBe(true)
    })

    test('constructor results', () => {
      expect(CBD({ space: 'a', key: 'a' }).constructor.name).toBe('Client')
    })

    test('constructor fails empty', () => {
      expect(() => CBD({})).toThrow(CBDConstructorErrorStr)
    })

    test('constructor fails without keys', () => {
      expect(() => CBD({ space: 'a' })).toThrow(CBDConstructorErrorStr)
    })

    test('constructor fails without space', () => {
      expect(() => CBD({ key: 'a' })).toThrow(CBDConstructorErrorStr)
    })

    test('constructor success with space and key', () => {
      expect(() => CBD({ space: 'a', key: 'a' })).not.toThrow(CBDConstructorErrorStr)
    })

    test('constructor success with space and previewKey', () => {
      expect(() => CBD({ space: 'a', previewKey: 'a' })).not.toThrow(CBDConstructorErrorStr)
    })

    test('retry feature propogates down to the fetch request', async () => {
      const cbd = CBD({ key: 'a', space: 'a', retry: 1 })
      await cbd.fetch({ content_type: 'a' })
      expect(cdaSpy).toHaveBeenCalled()
      const lastArgs = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs[1].retry).toBe(1)
    })
  })

  describe('fetch', () => {
    const cbd = CBD({
      space: 'spaceHere',
      key: 'keyHere',
      previewKey: 'previewKeyHere'
    })

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

    test('skip and limit', async () => {
      const results = await cbd.fetch({ content_type: 't', limit: 100, skip: 500 }, `{
        title
      }`)
      expect(results.length).toBe(100)
      expect(results[0].title).toBe(500)
    })

    test('select should be ignored', async () => {
      const results = await cbd.fetch({ content_type: 't', select: 'all,these,things' }, `{
        title
      }`)
      expect(results.length).toBe(5000)
      expect(cdaSpy).toHaveBeenCalled()

      const lastArgs = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs[0].select).toBe('sys.id')
      expect(lastArgs[1].isPreview).toBeFalsy()
      expect(lastArgs[1].key).toBe('keyHere')
      expect(lastArgs[1].env).toBe('master')
    })

    test('other fields should pass in', async () => {
      const results = await cbd.fetch({ content_type: 't', 'fields.test': 'ok' }, `{
        title
      }`)
      expect(results.length).toBe(5000)
      expect(cdaSpy).toHaveBeenCalled()

      const lastArgs = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs[0]['fields.test']).toBe('ok')
    })

    test('isPreview', async () => {
      const results = await cbd.fetch({ content_type: 't' }, `{
        title
      }`, {
        isPreview: true
      })
      expect(results.length).toBe(5000)
      expect(cdaSpy).toHaveBeenCalled()

      const lastArgs = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs[1].isPreview).toBe(true)
      expect(lastArgs[1].key).toBe('previewKeyHere')
    })

    test('should support env overrides', async () => {
      const cbd2 = CBD({
        space: 'spaceHere',
        key: 'keyHere',
        previewKey: 'previewKeyHere',
        env: 'envHere'
      })

      const results = await cbd2.fetch({ content_type: 't' }, `{
        title
      }`)
      expect(results.length).toBe(5000)
      expect(cdaSpy).toHaveBeenCalled()

      const lastArgs = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs[1].env).toBe('envHere')
    })

    test('verbose', async () => {
      const results = await cbd.fetch({ content_type: 't' }, `{
        title
      }`, {
        verbose: true
      })
      expect(results.data.tCollection.items.length).toBe(5000)
    })

    test('retry feature overrides on fetch request', async () => {
      await cbd.fetch({ content_type: 'a' })
      expect(cdaSpy).toHaveBeenCalled()
      const lastArgs = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs[1].retry).toBeFalsy()
      await cbd.fetch({ content_type: 'a' }, ``, { retry: 1 })
      const lastArgs2 = cdaSpy.mock.calls[cdaSpy.mock.calls.length - 1]
      expect(lastArgs2[1].retry).toBe(1)
    })
  })
})

const { convertTypeToGraph, getPages, cda, graphql } = require('./utils')
const { retryError } = require('./error')
const CONFIG = require('./config')

// jest.mock('node-fetch', () => {
//   return jest.fn().mockImplementation((url) => {
//     console.log('url', url)
//     return Promise.resolve({
//       json: () => ({total: 0, items: []})
//     })
//   })
// })

describe('utils', () => {
  test('convertTypeToGraph', () => {
    expect(convertTypeToGraph('test')).toBe('Test')
  })

  test('getPages', () => {
    const d = {
      total: 101,
      max: 100
    }
    expect(getPages(d)).toBe(2)
    expect(getPages({ ...d, skip: 2 })).toBe(1)
    expect(getPages({ ...d, limit: 11 })).toBe(1)
    expect(getPages({ ...d, limit: 11, max: 5 })).toBe(3)
    expect(getPages({ ...d, limit: 11, max: 5, skip: 5 })).toBe(3)
  })

  describe('cda', () => {
    // let mock
    beforeEach(() => {
      // nothing yet...
    })

    test('regular request', async () => {
      const res = await cda()
      expect(res.limit).toBe(100)
      expect(res.skip).toBe(0)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(100)
      expect(res.items[0].fields.index).toBe(0)
    })

    test('limited request', async () => {
      const res = await cda({ limit: 5 })
      expect(res.limit).toBe(5)
      expect(res.skip).toBe(0)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(5)
      expect(res.items[0].fields.index).toBe(0)
    })

    test('skip request', async () => {
      const res = await cda({ skip: 5 })
      expect(res.limit).toBe(100)
      expect(res.skip).toBe(5)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(100)
      expect(res.items[0].fields.index).toBe(5)
    })

    test('skip (edge case)', async () => {
      const skip = 4990
      const res = await cda({ skip })
      expect(res.limit).toBe(100)
      expect(res.skip).toBe(skip)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(10)
      expect(res.items[0].fields.index).toBe(skip)
    })

    test('skip and limit', async () => {
      const skip = 4990
      const limit = 50
      const res = await cda({ skip, limit })
      expect(res.limit).toBe(limit)
      expect(res.skip).toBe(skip)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(10)
      expect(res.items[0].fields.index).toBe(skip)
    })

    test('skip and limit (edge case)', async () => {
      const skip = 5
      const limit = 5
      const res = await cda({ skip, limit })
      expect(res.limit).toBe(limit)
      expect(res.skip).toBe(skip)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(limit)
      expect(res.items[0].fields.index).toBe(skip)
    })

    describe('Retry System', () => {
      beforeEach(() => {
        global.failRate = 0
      })

      /*
        - Success with 0
        - Success with 1
        - Fail with 0
        - Fail with 1
        - Success after 2 failed attempts (retry=3)
      */
      test('retry: 0, fails: 0 - Success', async () => {
        global.failRate = 0
        await expect(cda({}, { retry: 0 })).resolves
      })
      test('retry: 1, fails: 1 - Success', async () => {
        global.failRate = 0
        await expect(cda({}, { retry: 0 })).resolves
      })

      test('retry: 0, fails: 1 - Success', async () => {
        global.failRate = 1
        await expect(cda({}, { retry: 1 })).resolves
      })

      test('retry: default (3), fails: 1 - Success', async () => {
        global.failRate = 1
        await expect(cda({}, {})).resolves
      })

      test('retry: 0, fails: 1 - Fails', async () => {
        global.failRate = 1
        await expect(cda({}, { retry: 0 })).rejects.toThrow(retryError(0))
      })

      test('retry: 1, fails: 2 - Fails', async () => {
        global.failRate = 2
        await expect(cda({}, { retry: 1 })).rejects.toThrow(retryError(1))
      })

      test('retry: default (3), fails: 5 - Fails', async () => {
        global.failRate = 5
        await expect(cda({}, { })).rejects.toThrow(retryError(CONFIG.retry))
      })

      test('fail silently', async () => {
        global.failRate = 1
        const res = await cda({}, { retry: 0, failSilently: true })
        expect(res).toStrictEqual({ total: 0, limit: 0, skip: 0, items: [] })
      })
    })
  })

  describe('graphql', () => {
    const query = `query {
      pageCollection(where: {
        sys: {
          id_in: ["abc123"]
        }
      }) {
        items {
          title
        }
      }
    }`

    test('default response', async () => {
      const res = await graphql(query, {})
      expect(res.data.pageCollection.items.length).toBe(1)
    })

    test('(redundant) retry: default (3), fails: 1 - Success', async () => {
      global.failRate = 1
      await expect(graphql(query, {})).resolves
    })

    test('(redundant) retry: 0, fails: 1 - Fails', async () => {
      global.failRate = 1
      await expect(graphql(query, { retry: 0 })).rejects.toThrow(retryError(0))
    })
  })
})

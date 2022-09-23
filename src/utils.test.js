const { convertTypeToGraph, getPages, cda, graphql } = require('./utils')
const fetch = require('node-fetch')


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
    expect(convertTypeToGraph('test')).toBe('Test');
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
      // fetch.mockClear()
    })

    test('regular request', async () => {
      const res = await cda('test')
      expect(res.limit).toBe(100)
      expect(res.skip).toBe(0)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(100)
      expect(res.items[0].fields.index).toBe(0)
    })

    test('limited request', async () => {
      const res = await cda('test?limit=5')
      expect(res.limit).toBe(5)
      expect(res.skip).toBe(0)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(5)
      expect(res.items[0].fields.index).toBe(0)
    })

    test('skip request', async () => {
      const res = await cda('test?skip=5')
      expect(res.limit).toBe(100)
      expect(res.skip).toBe(5)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(100)
      expect(res.items[0].fields.index).toBe(5)
    })

    test('skip (edge case)', async () => {
      const start = 4990
      const res = await cda(`test?skip=${start}`)
      expect(res.limit).toBe(100)
      expect(res.skip).toBe(start)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(10)
      expect(res.items[0].fields.index).toBe(start)
    })

    test('skip and limit', async () => {
      const start = 4990
      const limit = 50
      const res = await cda(`test?skip=${start}&limit=${limit}`)
      expect(res.limit).toBe(limit)
      expect(res.skip).toBe(start)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(10)
      expect(res.items[0].fields.index).toBe(start)
    })

    test('skip and limit (edge case)', async () => {
      const start = 5
      const limit = 5
      const res = await cda(`test?skip=${start}&limit=${limit}`)
      expect(res.limit).toBe(limit)
      expect(res.skip).toBe(start)
      expect(res.total).toBe(5000)
      expect(res.items.length).toBe(limit)
      expect(res.items[0].fields.index).toBe(start)
    })
  })
  
  test('graphql', () => {
    
  })
})

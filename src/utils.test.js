const { convertTypeToGraph, getPages } = require('./utils')

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

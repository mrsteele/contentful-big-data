const CBD = require('.')

describe('CBD', () => {
  test('Client', () => {
    const cbd = CBD({})
    expect(cbd instanceof CBD.CBD).toBe(true)
  })
})

describe('index:fetch', () => {
  test('default', async () => {
    const cbd = CBD({})
    const results = await cbd.fetch({}, `{
      title
    }`)
    expect(results.length).toBe(1);
  })
  test('missing content_type', async () => {
    const cbd = CBD({})
    await expect(cbd.fetch({}, `{ title }`)).rejects.toThrow('The "content_type" property is required.')



    // try {
    //   console.log('try')
    //   const results = await cbd.fetch({}, `{
    //     title
    //   }`)

    //   // we have a problem...
    //   expect(true).toBe(false)
    // } catch (err) {
    //   console.log('fail')
    //   console.log(err.message)
    //   expect(1).toBe(1)
    //   // expect(err.message).toBe();
    // }
  })
})

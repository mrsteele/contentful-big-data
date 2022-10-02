# contentful-big-data
Use Contentful's CDA and GraphQL to do big queries

Badges - Go - Here

## About

This module is used to wrap around Contentful's CDA and GraphQL to make the most effective use of both of the APIs to perform powerful searches and more conservative response selectors.

### Features

* **Big-Data** - Use request-chains out-of-the-box to be able to grab large amounts of entries from Contentful (ignoring the 1k request limit).
```js
// the old way (WAY slower and larger response size)
const all = []
const perPage = 1000 // strict Contentful limit
// paginate over all the responses and combine
for (let i = 0; i < total; i++) {
  const results = await contentfulRESTRequest({
    skip: i * perPage,
    limit: perPage,
    include: 1
    'fields.author[in]': bigAllAuthorsArray,
    // we cannot grab just the image.src here...
    'select': 'fields.name,fields.image'
  })
  all.push(...results.items)
}

// better way (faster and smaller response size)
const results = await cbd.fetch({
  'fields.author[in]': bigAllAuthorsArray
}, `{
  name
  image { src }
}`)
```
* **Plug-And-Play** - We accept three arguments: your CDA parameters, your GraphQL schema, and our options. Use this library in place of your existing Contentful implementation and we will make sure your data is organized and noramlized.
* **Auto-Clean** - Do you expect all results to be populated? We will automatically clean if you want to remove those `null` results.

## Usage

1. First add this library to your node project:

```bash
npm i contentful-big-data
```

2. Import or require this package in your project, and 

This is the ES6 approach
```js
// es6
import CBD from 'contentful-big-data'

const cbd = CBD({
  space: 'space-id-here',
  key: 'space-key-here',
  previewKey: 'preview-key-here',
  env: 'env' // (defaults to 'master')
})

const results = await cbd.fetch({
  'fields.author[in]': bigAllAuthorsArray
}, `{
  name
  image { src }
}`)

// will return ALL the results in your space
console.log(results)
// [{ name: 'name-here', image: { src: 'https://cfassets.com/image/is/here' } }]
```

This is the commonjs approach
```js
// es6
const CBD = require('contentful-big-data')

const cbd = CBD({
  space: 'space-id-here',
  key: 'space-key-here',
  previewKey: 'preview-key-here',
  env: 'env' // (defaults to 'master')
})

cbd.fetch({
  'fields.author[in]': bigAllAuthorsArray
}, `{
  name
  image { src }
}`).then(results => {
  // will return ALL the results in your space
  console.log(results)
  // [{ name: 'name-here', image: { src: 'https://cfassets.com/image/is/here' } }]
})
```

## References

* https://www.contentful.com/developers/docs/references/content-delivery-api
* https://www.contentful.com/developers/docs/references/graphql/

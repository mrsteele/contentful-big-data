# contentful-big-data
Use Contentful's CDA and GraphQL to do big queries

[![npm version](https://badge.fury.io/js/contentful-big-data.svg)](https://badge.fury.io/js/contentful-big-data)

## About

This module is used to wrap around Contentful's CDA and GraphQL to make the most effective use of both of the APIs to perform powerful searches and more conservative response selectors.

## Usage

1. First add this library to your node project:

```bash
npm i contentful-big-data
```

2. Use the library like so

```js
// es6
import CBD from 'contentful-big-data'
// const CBD = require('contentful-big-data')

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
  image { url }
}`)

// You can also do this
// cbd.fetch({ ... }).then (results => ...)

// will return ALL the results in your space
console.log(results)
// [{ name: 'name-here', image: { url: 'https://cfassets.com/image/is/here' } }]
```

## Features

This library comes from a need due to limitations with Contentful
1. Request size too large
2. Response size too large
3. Response collection too narrow (not the full set)
4. Response includes `null` entries

Because of these limitations, this library has been created to satisfy these shortcomings.

* **Multi-Query** - The concept revolves around making a CDA request with `limit=0` with the purpose of getting the count of results. This tells us how many additional requests are needed to complete the dataset.
* **Multi-Service** - Instead of using the CDN or GraphQL, **use both**. The CDN is great for requesting all the IDs, and the GraphQL is useful for limiting the response size.
* **Size-Aware** - There are limitations on both the request and response sizes. We should break apart requests that are too large, and dynamically respond if we get a reponse too large error from Contentful. *(coming soon)*
* **Retry-Oriented** - Sometimes you hit a limit with Contentful. This could be from the size of the response, or because you hit the rate limiter. If that happens we should adjust where appropriate and try again. *(coming soon)*

## Examples

The following examples can be used as a guide in your own implementation.

```js
// get ALL entries title (careful, if you have 1 mil entries you get them all!)
const allEntries = await cbd.fetch({
  content_type: 'page'
}, `{
  title
}`)

// assuming you have paginated data, get only the second 100 assuming you are on page 2
const secondPage = await cbd.fetch({
  content_type: 'page',
  skip: 100,
  limit: 100
}, `{
  title
}`)

// Get the thumbnail, title and url of all pages that have specific authors
const linkedPages = await cbd.fetch({
  content_type: 'page',
  'fields.author.sys.id[in]': ['qwerty','yuiop']
  }, `{
    title
    url
    thumbnail {
      url
      width
      height
    }
}`)

```

## Docs

```js
cbd.fetch(filters={}, selectors='', options={})
```

* **filters** - Please refer to the [Content Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/) to look up all the properties. This library adheres to all of them, but will ignore the `select` property because we opt to use the GraphQL selectors for more granularity. Note that the `content_type` property is required due to limitations with Contentful.
* **selectors** - Please adhere to the [Contentful GraphQL API](https://www.contentful.com/developers/docs/references/graphql/) to determine how your query should be formatted. We always do a `Collection` request, just wrap your schema in curly braces.
* **options** - These are ours. Currently we support the following
  * **isPreview** (Bool) - If `true`, will use the `previewKey` and access the preview API for both the CDA and GraphQL services.
  * **verbose** (Bool) - If `true`, we will return the full GraphQL response object, otherwise we only return the array of results.

## References

* https://www.contentful.com/developers/docs/references/content-delivery-api
* https://www.contentful.com/developers/docs/references/graphql/

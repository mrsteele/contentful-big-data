# contentful-big-data 🥦

<img width="100" align="right" src="https://user-images.githubusercontent.com/5257284/194174575-ff35d11e-94b1-43a0-a7d4-626432a6f7bc.png" />

Use Contentful's CDA and GraphQL to do big queries

[![npm version](https://badge.fury.io/js/contentful-big-data.svg)](https://badge.fury.io/js/contentful-big-data)
[![codecov](https://codecov.io/gh/mrsteele/contentful-big-data/branch/main/graph/badge.svg?token=MKM3ID7DVP)](https://codecov.io/gh/mrsteele/contentful-big-data)

## About

Have you ever made a CDA request to Contentful, assuming you got all the data, only to later found out you had a total of 1001 entries and Contentful only supports 1000?

This module is used to wrap around Contentful's CDA and GraphQL to make the most effective use of both of the APIs to perform powerful searches and more conservative response selectors.

### Disclaimers

1. I do not work for Contentful. I am a developer who professionally and personally use the service and this is something I was seeing as a "missing link" to get the data in its entirety.
2. Use at your own risk. Contentful has limitations on how many API requests you can do in any given period. If you are charged for overages I recommend you pay attention to how you use this tool as it is meant to do a lot of queries.

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
  space: 'space-id-here'
  key: 'space-key-here'
})

const results = await cbd.fetch({
  // Regular CDA query parameters (read me here: https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters/inclusion)
  'fields.author[in]': 'authorid1,authorid2,authorid3'
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
* **Retry-Oriented** - Sometimes you hit a limit with Contentful. This could be from the size of the response, or because you hit the rate limiter. If that happens we should adjust where appropriate and try again.
* **Size-Aware** - There are limitations on both the request and response sizes. We should break apart requests that are too large, and dynamically respond if we get a reponse too large error from Contentful. *(coming soon)*

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

### CBD (constructor)

```js
const cbd = CBD(config={
  space: 'space-id-here', // (required) - Your space id in Contentful
  key: 'space-key-here', // (possibly required) - Your api access key to your Contentful space
  previewKey: 'preview-key-here', // (possibly required) - Your preview api access key to your Contentful space
  env: 'master', // (optional) - Your Contentful env. Defaults to `master`
  retry: 3, //  (optional) - The amount of retries after hitting the rate limiter for all requests. Defaults to `3`.
  failSilently: false // (optional) - If you want your requests to fail silently or throw an error. Defaults to false (and throws errors).
})
```

> Note - You can populate both `key` and `previewKey` but if you only plan to use the tool for one purpose, only one key is required.

### CBD.fetch

```js
// filters, selectors, and options
cbd.fetch(
  // filters - Please refer to the [Content Delivery API](https://www.contentful.com/developers/docs/references/content-delivery-api/) to look up all the properties. This library adheres to all of them, but will ignore the `select` property because we opt to use the GraphQL selectors for more granularity. Note that the `content_type` property is required due to limitations with Contentful.
{
  custom: 'see below'
},
// selectors - Please adhere to the [Contentful GraphQL API](https://www.contentful.com/developers/docs/references/graphql/) to determine how your query should be formatted. We always do a `Collection` request, just wrap your schema in curly braces.
`{
  fields
  goHere
  graphQL {
    entries
  }
  seeSelectorsBelow
}`,
// options - Comments below...
{
  isPreview: false, // (optional) - If `true`, will use the `previewKey` and access the preview API for both the CDA and GraphQL services.
  retry: 3, // (optional) - If set, this number will be used at retry attempts. Default retry attempts is `3` but depends on your use-case and how many other services are hitting Contentful APIs at the same time.
  verbose: false, // If `true`, we will return the full GraphQL response object, otherwise we only return the array of results.
  failSilently: false, // (optional) - If `true`, this will not throw any errors when requests fail.
})
```

## References

* https://www.contentful.com/developers/docs/references/content-delivery-api
* https://www.contentful.com/developers/docs/references/graphql/

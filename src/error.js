module.exports.retryError = (retry) => `Contentful CDA unreachable after ${retry} retries. Please check your internet connection or the Contentful status page.`
module.exports.spaceKeyError = '"space" and at least "key" or "previewKey" are required.'
module.exports.contentTypeError = 'The "content_type" property is required.'

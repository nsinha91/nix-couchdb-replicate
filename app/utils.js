const validator = require("validator")

const chunkArray = ({ arr, chunkSize }) => {
  const chunks = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize))
  }
  return chunks
}

const stripCredentialsFromUrl = (url) => {
  const urlObj = new URL(url)
  const { username, password, origin, pathname, search, hash } = urlObj
  let cleanedUrl = `${origin}/${pathname}/${search}/${hash}`
  const isTrailingSlashInCleanedUrl = cleanedUrl.match("/.*/$")
  if (isTrailingSlashInCleanedUrl) {
    cleanedUrl = cleanedUrl.replace(/\/+$/, "")
  }
  return {
    credentialsStrippedUrl: cleanedUrl,
    username: decodeURIComponent(username),
    password: decodeURIComponent(password),
  }
}

const urlArgValidationFn = (val) => {
  return validator.isURL(val, {
    require_tld: false, // Allows localhost.
    require_protocol: true,
    require_valid_protocol: false, // So that arbitrary protocols like chrome:// are allowed.
    allow_underscores: true,
  })
}

const listArgValidationFn = (val) => {
  const valArr = val.split(",")
  return valArr.every((el) => el !== "")
}

const intArgValidationFn = (val, min, max) => {
  return validator.isInt(val, { min, max, allow_leading_zeroes: false })
}

module.exports = {
  chunkArray,
  stripCredentialsFromUrl,
  urlArgValidationFn,
  listArgValidationFn,
  intArgValidationFn,
}

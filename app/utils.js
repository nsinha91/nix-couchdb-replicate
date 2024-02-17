const validator = require("validator")

const stripCredentialsFromUrl = (url) => {
  const urlObj = new URL(url)
  const { username, password, origin, pathname, search, hash } = urlObj
  let cleanedUrl = `${origin}/${pathname}/${search}/${hash}`
  const isTrailingSlashInCleanedUrl = cleanedUrl.match("/.*/$")
  if (isTrailingSlashInCleanedUrl) {
    cleanedUrl = cleanedUrl.replace(/\/+$/, "")
  }
  return { credentialsStrippedUrl: cleanedUrl, username, password }
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

module.exports = {
  stripCredentialsFromUrl,
  urlArgValidationFn,
  listArgValidationFn,
}

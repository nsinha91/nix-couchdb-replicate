const validator = require("validator")
const packageDotJson = require("../../package.json")
const { stripCredentialsFromUrl } = require("../utils")

const isHelpArg = ({ noArgPassed, singleArgPassed, helpArgConfig, args }) => {
  return (
    noArgPassed || (singleArgPassed && helpArgConfig.names.includes(args[0]))
  )
}

const isVersionArg = ({ singleArgPassed, versionArgConfig, args }) => {
  return singleArgPassed && versionArgConfig.names.includes(args[0])
}

const getValidatedMainArgs = ({ args, mainArgsConfig }) => {
  // -- Variables --
  const validatedMainArgs = {}
  // -- Validate passed main args --
  for (const arg of args) {
    // -- Variables --
    const argName = arg.substring(0, arg.indexOf("="))
    let argValue = arg.substring(arg.indexOf("=") + 1)
    const argConfig = Object.values(mainArgsConfig).find(
      (mainArgConfig) => argName === mainArgConfig.name
    )
    // -- Error out if arg unknown --
    if (!argConfig) {
      console.error(
        `Unknown option "${argName}" passed. Run "${packageDotJson.name} --help" to see usage info.`
      )
      return false
    }
    // -- Error out if arg value incorrect --
    if (argConfig.validValues) {
      if (!validator.isIn(argValue, argConfig.validValues)) {
        console.error(
          `Incorrect value for option "${argName}". Run "${packageDotJson.name} --help" to see usage info.`
        )
        return false
      }
    } else if (argConfig.validationFn) {
      if (!argConfig.validationFn(argValue)) {
        console.error(
          `Incorrect value for option "${argName}". Run "${packageDotJson.name} --help" to see usage info.`
        )
        return false
      }
    }
    // -- Sanitize if required --
    if (argConfig.sanitize) {
      argValue = argConfig.sanitize(argValue)
    }
    // -- Populate validated main args --
    validatedMainArgs[argName] = argValue
  }
  // -- Error out if all required main args not passed --
  const requiredMainArgNames = Object.values(mainArgsConfig)
    .filter((mainArgConfig) => mainArgConfig.required)
    .map((mainArgConfig) => mainArgConfig.name)
  const mainArgNamesPassed = Object.keys(validatedMainArgs)
  const requiredMainArgNamesNotPassed = requiredMainArgNames.filter(
    (requiredMainArgName) => !mainArgNamesPassed.includes(requiredMainArgName)
  )
  if (requiredMainArgNamesNotPassed.length > 0) {
    console.error(
      `Missing required option(s): "${requiredMainArgNamesNotPassed.join('", "')}". Run "${packageDotJson.name} --help" to see usage info.`
    )
    return false
  }
  // -- Populate validated main args for not-passed, not-required main args --
  for (const mainArgConfig of Object.values(mainArgsConfig)) {
    const mainArgConfigPassed = Object.prototype.hasOwnProperty.call(
      validatedMainArgs,
      mainArgConfig.name
    )
    if (!mainArgConfigPassed) {
      const mainArgHasDefaultValue = Object.prototype.hasOwnProperty.call(
        mainArgConfig,
        "defaultValue"
      )
      const mainArgHasDefaultValueArg = Object.prototype.hasOwnProperty.call(
        mainArgConfig,
        "defaultValueArg"
      )
      if (mainArgHasDefaultValue) {
        validatedMainArgs[mainArgConfig.name] = mainArgConfig.defaultValue
      } else if (mainArgHasDefaultValueArg) {
        validatedMainArgs[mainArgConfig.name] =
          mainArgConfig.stripCredentialsFromDefaultValueUrl
            ? stripCredentialsFromUrl(
                validatedMainArgs[mainArgConfig.defaultValueArg]
              ).credentialsStrippedUrl
            : validatedMainArgs[mainArgConfig.defaultValueArg]
      }
    }
  }
  // -- Return --
  return validatedMainArgs
}

module.exports = {
  isHelpArg,
  isVersionArg,
  getValidatedMainArgs,
}

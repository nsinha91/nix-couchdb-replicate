const validator = require("validator")
const packageDotJson = require("../package.json")
const { stripCredentialsFromUrl } = require("./utils")

const checkDbServer = async ({ url, username, password }) => {
  const response = await fetch(url, {
    method: "GET",
    headers: new Headers({
      Authorization: "Basic " + btoa(`${username}:${password}`),
    }),
  })
  if (response.ok) {
    return true
  } else {
    throw new Error(await response.text())
  }
}

const getAllDbNames = async ({ url, username, password }) => {
  const response = await fetch(`${url}/_all_dbs`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Basic " + btoa(`${username}:${password}`),
    }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(await response.text())
  }
}

const filterSourceDbNamesToReplicate = ({
  allSourceDbNames,
  includeUsersDb,
  nonUsersSystemDbsToInclude,
}) => {
  return allSourceDbNames.filter((dbName) => {
    if (dbName === "_users") {
      return includeUsersDb
    } else if (dbName.startsWith("_")) {
      return nonUsersSystemDbsToInclude.includes(dbName)
    } else {
      return true
    }
  })
}

const replicateDb = async ({
  dbName,
  executionServer,
  sourceDbServerUrl,
  sourceDbServerUsername,
  sourceDbServerPassword,
  targetDbServerUrl,
  targetDbServerUsername,
  targetDbServerPassword,
  sourceUrlInsideExecutionServer,
  targetUrlInsideExecutionServer,
}) => {
  const executionDbServerUrl =
    executionServer === "source" ? sourceDbServerUrl : targetDbServerUrl
  const executionDbServerUsername =
    executionServer === "source"
      ? sourceDbServerUsername
      : targetDbServerUsername
  const executionDbServerPassword =
    executionServer === "source"
      ? sourceDbServerPassword
      : targetDbServerPassword
  const response = await fetch(`${executionDbServerUrl}/_replicate`, {
    method: "POST",
    headers: new Headers({
      Authorization:
        "Basic " +
        btoa(`${executionDbServerUsername}:${executionDbServerPassword}`),
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      create_target: true,
      source: {
        url: `${sourceUrlInsideExecutionServer || sourceDbServerUrl}/${dbName}`,
        headers: {
          Authorization:
            "Basic " +
            btoa(`${sourceDbServerUsername}:${sourceDbServerPassword}`),
        },
      },
      target: {
        url: `${targetUrlInsideExecutionServer || targetDbServerUrl}/${dbName}`,
        headers: {
          Authorization:
            "Basic " +
            btoa(`${targetDbServerUsername}:${targetDbServerPassword}`),
        },
      },
    }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(await response.text())
  }
}

const isHelpArg = ({ noArgPassed, singleArgPassed, helpArgConfig, args }) => {
  return (
    noArgPassed || (singleArgPassed && helpArgConfig.names.includes(args[0]))
  )
}

const isVersionArg = ({ singleArgPassed, versionArgConfig, args }) => {
  return singleArgPassed && versionArgConfig.names.includes(args[0])
}

const showHelpInfo = ({ argsConfig }) => {
  console.log("\nDESCRIPTION:")
  console.log(`${packageDotJson.description}`)
  console.log("\nUSAGE:")
  console.log("nix-couchdb-replicate <option1>=<value1> <option2>=<value2> ...")
  console.log("\nEXAMPLE USAGE:")
  console.log(
    "nix-couchdb-replicate source_url=http://admin:password@localhost:5984 target_url=http://admin:password@db.example.com"
  )
  console.log("\nOPTIONS:")
  for (const argConfig of Object.values(argsConfig)) {
    console.log(`${argConfig.name}${argConfig.required ? "*" : ""}`)
    console.log(`> ${argConfig.description}`)
    if (argConfig.validValues) {
      console.log(`> Possible values = ${argConfig.validValues.join(", ")}`)
    }
    console.log("")
  }
  console.log("MORE EXAMPLES:")
  console.log("-> When target is a local installation:")
  console.log(
    "nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@localhost:5984 use_target_replicator=true"
  )
  console.log("-> Faster replication using a larger batch size:")
  console.log(
    "nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 batch_size=20"
  )
  console.log("-> Skipping the _replicator and _users dbs for replication:")
  console.log(
    "nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 skip_dbs=_replicator,_users"
  )
}

const showVersionInfo = () => {
  console.log(packageDotJson.version)
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
  checkDbServer,
  getAllDbNames,
  filterSourceDbNamesToReplicate,
  replicateDb,
  isHelpArg,
  isVersionArg,
  showHelpInfo,
  showVersionInfo,
  getValidatedMainArgs,
}

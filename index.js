#!/usr/bin/env node
const cliProgress = require("cli-progress")
const package = require("./package.json")

const validator = {
  sourceUrl: {
    fieldName: "source_url",
    description: "Url of the CouchDB installation from where to clone dbs.",
    required: true,
    validationFn: (val) => !!val,
    sanitizationFn: (val) => val,
    value: null,
    errorMsg: "source_url is a required argument",
  },
  targetUrl: {
    fieldName: "target_url",
    description:
      "Url of the CouchDB installation where to clone dbs to.",
    required: true,
    validationFn: (val) => !!val,
    sanitizationFn: (val) => val,
    value: null,
    errorMsg: "target_url is a required argument",
  },
  batchSize: {
    fieldName: "batch_size",
    description:
      "Number of dbs to clone in parallel. A higher value means faster replication but also higher utilization of resources. A lower value means slower replication and better utilization of resources.",
    defaultValue: 5,
    required: false,
    validationFn: (val) => !!val && !isNaN(val),
    sanitizationFn: (val) => val,
    value: null,
    errorMsg: "batch_size should be a number greater than 0",
  },
  skipDbs: {
    fieldName: "skip_dbs",
    description: "The dbs to not be included in the replication.",
    defaultValue: ["_replicator"],
    required: false,
    validationFn: (val) => !!val,
    sanitizationFn: (val) => val.split(","),
    value: null,
    errorMsg:
      "skip_dbs should be a comma-separated string of db names, e.g., skip_dbs=userDb1, userDb2,userDb3",
  },
  useTargetReplicator: {
    fieldName: "use_target_replicator",
    description:
      "Whether to use the _replicator database of the target for replication. This is useful when the target is a localhost url. By default, the _replicator database of the source is used.",
    defaultValue: false,
    required: false,
    validationFn: (val) => val === "true" || val === "false",
    sanitizationFn: (val) => val === "true",
    value: null,
    errorMsg: "use_target_replicator should either be true or false",
  },
}

const getValidatedValueArgs = (args) => {
  for (const arg of args) {
    const [argKey, argVal] = arg.split(/=(.+)/)
    const validationFieldKey = Object.keys(validator).find(
      (key) => validator[key].fieldName === argKey
    )
    if (!!validationFieldKey) {
      const validatorFieldObj = validator[validationFieldKey]
      const isValid = validatorFieldObj.validationFn(argVal)
      validatorFieldObj.value = isValid
        ? validatorFieldObj.sanitizationFn(argVal)
        : undefined
    }
  }
  let validationFailed = false
  const validatedValueArgs = {}
  Object.entries(validator).forEach(([field, fieldDetails]) => {
    if (
      fieldDetails.required &&
      (fieldDetails.value === null || fieldDetails.value === undefined)
    ) {
      validationFailed = true
      console.log("Error:", fieldDetails.errorMsg)
    } else if (!fieldDetails.required && fieldDetails.value === undefined) {
      validationFailed = true
      console.log("Error:", fieldDetails.errorMsg)
    } else if (fieldDetails.value !== null)
      validatedValueArgs[field] = fieldDetails.value
  })
  return validationFailed ? false : validatedValueArgs
}

const splitArrIntoChunks = ({ arr, chunkSize }) =>
  Array(Math.ceil(arr.length / chunkSize))
    .fill()
    .map((_, index) => index * chunkSize)
    .map((begin) => arr.slice(begin, begin + chunkSize))

const showHelpInfo = () => {
  console.log("\nDescription:")
  console.log(`${package.description}`)
  console.log("\nUsage:")
  console.log("node index <option1>=<value1> <option2>=<value2> ...")
  console.log("\nExample Usage:")
  console.log(
    "node index source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984"
  )
  console.log("\nOptions:")
  Object.values(validator).forEach((fieldDetails) => {
    console.log(
      `${fieldDetails.fieldName}${fieldDetails.required ? "*" : ""} --> ${
        fieldDetails.description
      }`
    )
  })
  console.log("\nDefault Options:")
  Object.values(validator).forEach((fieldDetails) => {
    if (fieldDetails.defaultValue !== undefined)
      console.log(`${fieldDetails.fieldName}=${fieldDetails.defaultValue}`)
  })
  console.log("\nMore Examples:")
  console.log("-> When target is a local installation:")
  console.log(
    "node index source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@localhost:5984 use_target_replicator=true"
  )
  console.log("-> Faster replication using a larger batch size:")
  console.log(
    "node index source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 batch_size=20"
  )
  console.log("-> Skipping the _replicator and _users dbs for replication:")
  console.log(
    "node index source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 skip_dbs=_replicator,_users"
  )
}

const showVersionInfo = () => {
  console.log(package.version)
}

const execute = async () => {
  try {
    // Argument validation and fetching.
    const args = process.argv.slice(2)
    if (args[0] === "--help" || args[0] === "-h") {
      showHelpInfo()
      return
    } else if (args[0] === "--version" || args[0] === "-v") {
      showVersionInfo()
      return
    }
    const valueArgs = getValidatedValueArgs(process.argv.slice(2))
    if (!valueArgs) return
    let {
      sourceUrl,
      targetUrl,
      batchSize = validator.batchSize.defaultValue,
      skipDbs = validator.skipDbs.defaultValue,
      useTargetReplicator = validator.useTargetReplicator.defaultValue,
    } = valueArgs

    // Set up.
    const targetNano = require("nano")(targetUrl)
    const sourceNano = require("nano")(sourceUrl)
    let sourceDbNames = await sourceNano.db.list()
    sourceDbNames = sourceDbNames.filter(
      (item) => !skipDbs.some((skipItem) => skipItem === item)
    )
    if (!sourceDbNames.length) {
      console.log("No dbs to replicate")
      return
    }
    console.log(`Replicating ${sourceDbNames.length} databases ...`)

    // Initialize progress bar.
    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    )
    progressBar.start(sourceDbNames.length, 0)

    // Split the sourceDbNames array into chunks each having size equal to the batchSize.
    const sourceDbNamesChunks = splitArrIntoChunks({
      arr: sourceDbNames,
      chunkSize: batchSize,
    })

    // Set the nano instance to use for replication.
    const nanoToUseForReplication = useTargetReplicator
      ? targetNano
      : sourceNano

    // Execute replication.
    let processedCount = 0
    let successCount = 0
    const errorItems = []
    await (() =>
      new Promise(async (resolve1, reject) => {
        for (const dbNamesChunk of sourceDbNamesChunks) {
          await (() =>
            new Promise((resolve2, reject) => {
              for (const [i, dbName] of dbNamesChunk.entries()) {
                nanoToUseForReplication.db
                  .replicate(
                    `${sourceUrl}/${dbName}`,
                    `${targetUrl}/${dbName}`,
                    {
                      create_target: true,
                    }
                  )
                  .then((data) => {
                    successCount += 1
                  })
                  .catch((err) => {
                    errorItems.push({ dbName, error: err.message })
                  })
                  .finally(() => {
                    processedCount++
                    progressBar.update(processedCount)
                    if (processedCount === sourceDbNames.length) {
                      resolve2(true)
                      resolve1(true)
                    } else if (i === dbNamesChunk.length - 1) resolve2(true)
                  })
              }
            }))()
        }
      }))()

    // End process.
    progressBar.stop()
    console.log(`\nSummary:\n${sourceDbNames.length} dbs processed`)
    if (successCount) console.log(`${successCount} dbs successfully replicated`)
    if (errorItems.length) {
      console.log(`${errorItems.length} dbs failed to replicate\nError items:`)
      for (const item of errorItems) console.dir(item, { depth: null })
    }
  } catch (err) {
    console.log("Error:", err.message)
  }
  process.exit()
}

execute()

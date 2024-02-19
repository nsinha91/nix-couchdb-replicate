#!/usr/bin/env node
// -- Imports --
const cliProgress = require("cli-progress")
const { helpArgConfig, versionArgConfig, mainArgsConfig } = require("./config")
const { stripCredentialsFromUrl, chunkArray } = require("./utils")
const {
  getAllDbNames,
  replicateDb,
  checkDbServer,
  filterSourceDbNamesToReplicate,
} = require("./services/db")
const {
  isHelpArg,
  isVersionArg,
  getValidatedMainArgs,
} = require("./services/args")
const { showHelpInfo, showVersionInfo } = require("./services/info")

// -- Main --
const main = async () => {
  try {
    // -- Variables --
    const args = process.argv.slice(2) // Automatically accounts for trimming of the input args, therefore, that does not need to be seprately handled.
    const noArgPassed = args.length === 0
    const singleArgPassed = args.length === 1
    // -- Show help/version info if required --
    if (isHelpArg({ noArgPassed, singleArgPassed, helpArgConfig, args })) {
      showHelpInfo({ argsConfig: mainArgsConfig })
      return
    }
    if (isVersionArg({ singleArgPassed, versionArgConfig, args })) {
      showVersionInfo()
      return
    }
    // -- Get validated main args --
    const validatedMainArgs = getValidatedMainArgs({ args, mainArgsConfig })
    console.log(
      `\n> Running replication with the following config:\n${JSON.stringify(validatedMainArgs, null, 2)}\n`
    )
    // -- Get url and credentials for db servers --
    const {
      credentialsStrippedUrl: sourceDbServerUrl,
      username: sourceDbServerUsername,
      password: sourceDbServerPassword,
    } = stripCredentialsFromUrl(validatedMainArgs.source_url)
    const {
      credentialsStrippedUrl: targetDbServerUrl,
      username: targetDbServerUsername,
      password: targetDbServerPassword,
    } = stripCredentialsFromUrl(validatedMainArgs.target_url)
    // -- Check db servers --
    console.log("> Checks:")
    await checkDbServer({
      url: sourceDbServerUrl,
      username: sourceDbServerUsername,
      password: sourceDbServerPassword,
    })
    console.log("\u2713 Source db server reachable")
    await checkDbServer({
      url: targetDbServerUrl,
      username: targetDbServerUsername,
      password: targetDbServerPassword,
    })
    console.log("\u2713 Target db server reachable")
    // -- Get source db names to replicate --
    const allSourceDbNames = await getAllDbNames({
      url: sourceDbServerUrl,
      username: sourceDbServerUsername,
      password: sourceDbServerPassword,
    })
    const sourceDbNamesToReplicate = filterSourceDbNamesToReplicate({
      allSourceDbNames,
      includeUsersDb: validatedMainArgs.include_users_db,
      nonUsersSystemDbsToInclude:
        validatedMainArgs.non_users_system_dbs_to_include,
      nonSystemDbsToInclude: validatedMainArgs.non_system_dbs_to_include,
      nonSystemDbsToExclude: validatedMainArgs.non_system_dbs_to_exclude,
    })
    // -- Check if there are dbs to replicate --
    if (sourceDbNamesToReplicate.length === 0) {
      throw new Error("No dbs to replicate.")
    }
    // -- Replicate dbs --
    console.log("\n> Progress:")
    const sourceDbNameChunksToReplicate = chunkArray({
      arr: sourceDbNamesToReplicate,
      chunkSize: validatedMainArgs.batch_size,
    })
    const totalNoOfDbsInSource = allSourceDbNames.length
    const noOfDbsToReplicate = sourceDbNamesToReplicate.length
    const replicateDbResponses = []
    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    )
    progressBar.start(noOfDbsToReplicate, 0)
    for (const chunkedSourceDbNamesToReplicate of sourceDbNameChunksToReplicate) {
      const chunkedReplicateDbResponsePromises = []
      for (const dbName of chunkedSourceDbNamesToReplicate) {
        const replicateDbResponsePromise = new Promise((resolve) => {
          replicateDb({
            dbName,
            includeSecurityObjects: validatedMainArgs.include_security_objects,
            executionServer: validatedMainArgs.execution_server,
            sourceDbServerUrl,
            sourceDbServerUsername,
            sourceDbServerPassword,
            targetDbServerUrl,
            targetDbServerUsername,
            targetDbServerPassword,
            sourceUrlInsideExecutionServer:
              validatedMainArgs.source_url_inside_execution_server,
            targetUrlInsideExecutionServer:
              validatedMainArgs.target_url_inside_execution_server,
          }).then((replicateDbResponse) => {
            replicateDbResponses.push(replicateDbResponse)
            progressBar.update(replicateDbResponses.length)
            resolve(true)
          })
        })
        chunkedReplicateDbResponsePromises.push(replicateDbResponsePromise)
      }
      await Promise.allSettled(chunkedReplicateDbResponsePromises)
    }
    progressBar.stop()
    const noOfSourceDbsForWhichDataReplicated = replicateDbResponses.filter(
      (response) => response.dbReplicated
    ).length
    const noOfTargetDbsForWhichSecurityObjOverwritten =
      replicateDbResponses.filter(
        (response) => response.securityOverwritten
      ).length
    const noOfTargetDbsForWhichDataChanged = replicateDbResponses.filter(
      (response) => response.dbChanged
    ).length
    const failedReplicateDbResponses = replicateDbResponses.filter(
      (response) => response.code
    )
    const errors = failedReplicateDbResponses.map((response) => ({
      db_name: response.dbName,
      code: response.code,
      status: response.status,
      message: response.message,
      source_db_replicated: response.dbReplicated,
      target_db_changed: response.dbChanged,
    }))
    const summary = {
      total_no_of_dbs_in_source: totalNoOfDbsInSource,
      no_of_source_dbs_to_replicate: noOfDbsToReplicate,
      no_of_source_dbs_for_which_data_replicated:
        noOfSourceDbsForWhichDataReplicated,
      no_of_target_dbs_for_which_data_changed: noOfTargetDbsForWhichDataChanged,
      no_of_target_dbs_for_which_security_obj_overwritten:
        noOfTargetDbsForWhichSecurityObjOverwritten,
      no_of_errors: failedReplicateDbResponses.length,
      errors,
    }
    // -- Info to user --
    console.log("\n> Summary:")
    console.log(JSON.stringify(summary, null, 2))
  } catch (err) {
    console.log("")
    console.error(err)
  }
}

// -- Run --
main()

// -- Imports --
const cliProgress = require("cli-progress")
const { helpArgConfig, versionArgConfig, mainArgsConfig } = require("./config")
const { stripCredentialsFromUrl } = require("./utils")
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
    // -- Get validated main args or error out --
    const validatedMainArgs = getValidatedMainArgs({ args, mainArgsConfig })
    if (!validatedMainArgs) {
      return
    }
    // -- Info to user --
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
    })
    // -- Replicate dbs --
    console.log("\n> Progress:")
    const totalNoOfDbsInSource = allSourceDbNames.length
    const noOfDbsToReplicate = sourceDbNamesToReplicate.length
    const replicateDbResponses = []
    const progressBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    )
    progressBar.start(noOfDbsToReplicate, 0)
    for (const [i, dbName] of sourceDbNamesToReplicate.entries()) {
      const replicateDbResponse = await replicateDb({
        dbName,
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
      })
      replicateDbResponses.push(replicateDbResponse)
      progressBar.update(i + 1)
    }
    progressBar.stop()
    const successfulReplicateDbResponses = replicateDbResponses.filter(
      (response) => response.success
    )
    const failedReplicateDbResponses = replicateDbResponses.filter(
      (response) => !response.success
    )
    const summary = {
      total_no_of_dbs_in_source: totalNoOfDbsInSource,
      no_of_source_dbs_to_replicate: noOfDbsToReplicate,
      no_of_source_dbs_replicated: successfulReplicateDbResponses.length,
      no_of_target_dbs_changed: successfulReplicateDbResponses.filter(
        (response) => response.dbChanged
      ).length,
      ...(failedReplicateDbResponses.length > 0 && {
        no_of_db_replications_failed: failedReplicateDbResponses.length,
        db_replication_errors: failedReplicateDbResponses.map((response) => ({
          db_name: response.dbName,
          status: response.status,
          message: response.message,
        })),
      }),
    }
    // -- Info to user --
    console.log("\n> Summary:")
    console.log(JSON.stringify(summary, null, 2))
  } catch (err) {
    console.error(err)
  }
}

main()

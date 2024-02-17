// -- Imports --
const { helpArgConfig, versionArgConfig, mainArgsConfig } = require("./config")
const { stripCredentialsFromUrl } = require("./utils")
const {
  getAllDbNames,
  replicateDb,
  isHelpArg,
  isVersionArg,
  showHelpInfo,
  showVersionInfo,
  getValidatedMainArgs,
  checkDbServer,
  filterSourceDbNamesToReplicate,
} = require("./services")

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
    for (const dbName of sourceDbNamesToReplicate) {
      const replicationResponse = await replicateDb({
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
      console.log(1, replicationResponse)
    }
  } catch (err) {
    console.error(err)
  }
}

main()

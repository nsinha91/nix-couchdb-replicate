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
    const { ok, no_changes: noChanges } = await response.json()
    if (ok) {
      return { success: true, dbChanged: !noChanges }
    } else {
      return { success: false }
    }
  } else {
    return {
      success: false,
      dbName,
      status: response.status,
      message: await response.text(),
    }
  }
}

module.exports = {
  checkDbServer,
  getAllDbNames,
  filterSourceDbNamesToReplicate,
  replicateDb,
}

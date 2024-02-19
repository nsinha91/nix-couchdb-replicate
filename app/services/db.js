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
  nonSystemDbsToInclude,
  nonSystemDbsToExclude,
}) => {
  return allSourceDbNames.filter((dbName) => {
    if (dbName.startsWith("_")) {
      if (dbName === "_users") {
        return includeUsersDb
      } else {
        return nonUsersSystemDbsToInclude.includes(dbName)
      }
    } else {
      if (nonSystemDbsToInclude.length > 0) {
        return (
          nonSystemDbsToInclude.includes(dbName) &&
          !nonSystemDbsToExclude.includes(dbName)
        )
      } else {
        return !nonSystemDbsToExclude.includes(dbName)
      }
    }
  })
}

const replicateDb = async ({
  dbName,
  includeSecurityObjects,
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
  // -- Variables --
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
  const response = {}
  // -- Replicate db --
  const dbReplicationResponse = await fetch(
    `${executionDbServerUrl}/_replicate`,
    {
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
    }
  )
  if (dbReplicationResponse.ok) {
    const { ok, no_changes: noChanges } = await dbReplicationResponse.json()
    if (ok) {
      response.dbReplicated = true
      response.dbChanged = !noChanges
    } else {
      return {
        code: "replicate_failed",
        dbName,
      }
    }
  } else {
    return {
      code: "replicate_failed",
      dbName,
      status: dbReplicationResponse.status,
      message: await dbReplicationResponse.text(),
    }
  }
  // -- Return if security objects not included in replication --
  if (!includeSecurityObjects) {
    return response
  }
  // -- Variables --
  let sourceDbSecurityObj
  // -- Get security object of source db --
  const getSourceDbSecurityObjResponse = await fetch(
    `${sourceDbServerUrl}/${dbName}/_security`,
    {
      method: "GET",
      headers: new Headers({
        Authorization:
          "Basic " +
          btoa(`${sourceDbServerUsername}:${sourceDbServerPassword}`),
        "Content-Type": "application/json",
      }),
    }
  )
  if (getSourceDbSecurityObjResponse.ok) {
    sourceDbSecurityObj = await getSourceDbSecurityObjResponse.json()
  } else {
    return {
      code: "get_source_security_failed",
      dbName,
      dbReplicated: true,
      dbChanged: response.dbChanged,
      status: getSourceDbSecurityObjResponse.status,
      message: await getSourceDbSecurityObjResponse.text(),
    }
  }
  // -- Put security object in target db --
  const putTargetDbSecurityObjResponse = await fetch(
    `${targetDbServerUrl}/${dbName}/_security`,
    {
      method: "PUT",
      headers: new Headers({
        Authorization:
          "Basic " +
          btoa(`${targetDbServerUsername}:${targetDbServerPassword}`),
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(sourceDbSecurityObj),
    }
  )
  if (putTargetDbSecurityObjResponse.ok) {
    const { ok } = await putTargetDbSecurityObjResponse.json()
    if (ok) {
      response.securityOverwritten = true
      return response
    } else {
      return {
        code: "put_target_security_failed",
        dbName,
        dbReplicated: true,
        dbChanged: response.dbChanged,
      }
    }
  } else {
    return {
      code: "put_target_security_failed",
      dbName,
      dbReplicated: true,
      dbChanged: response.dbChanged,
      status: putTargetDbSecurityObjResponse.status,
      message: await putTargetDbSecurityObjResponse.text(),
    }
  }
}

module.exports = {
  checkDbServer,
  getAllDbNames,
  filterSourceDbNamesToReplicate,
  replicateDb,
}

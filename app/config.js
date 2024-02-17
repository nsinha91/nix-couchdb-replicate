const { urlArgValidationFn, listArgValidationFn } = require("./utils")

const helpArgConfig = {
  names: ["-h", "--help"],
  description: "Shows info related to usage of the cli.",
}

const versionArgConfig = {
  names: ["-v", "--version"],
  description: "Shows version of the cli.",
}

const mainArgsConfig = {
  sourceUrl: {
    name: "source_url",
    description:
      "Url of the CouchDB installation from where to clone dbs. Should be a valid url containing the server admin credentials, e.g., 'http://admin:password@localhost:5984'.",
    required: true,
    validationFn: urlArgValidationFn,
  },
  targetUrl: {
    name: "target_url",
    description:
      "Url of the CouchDB installation where to clone dbs to. Should be a valid url containing the server admin credentials, e.g., 'http://admin:password@db.example.com'.",
    required: true,
    validationFn: urlArgValidationFn,
  },
  includeUsersDb: {
    name: "include_users_db",
    description:
      "Whether to include the '_users' db in the replication. If passed, should be either 'true' or 'false'. Defaults to 'true'.",
    defaultValue: true,
    validValues: ["true", "false"],
    sanitize: (val) => val === "true",
  },
  nonUsersSystemDbsToInclude: {
    name: "non_users_system_dbs_to_include",
    description:
      "System dbs (those whose names begin with '_') other than '_users' (such as '_replicator' and '_global_changes') to be included in the replication. If passed, should be a comma-separated string of db names, e.g., 'non_users_system_dbs_to_include=_replicator,_global_changes'. By default, no system dbs other than '_users' are included in the replication.",
    defaultValue: [],
    validationFn: listArgValidationFn,
    sanitize: (val) => val.split(","),
  },
  executionServer: {
    name: "execution_server",
    description:
      "Server on which to execute the call to CouchDB's '_replicate' api. If passed, should be either 'source' or 'target'. Defaults to 'source'.",
    defaultValue: "source",
    validValues: ["source", "target"],
  },
  sourceUrlInsideExecutionServer: {
    name: "source_url_inside_execution_server",
    description:
      "Url of the source CouchDB server to be used when the cli connects to it from inside the execution server. This is especially useful when both, the source server and the target server, are running inside docker containers on the same machine. If passed, should be a valid url WITHOUT credentials, e.g., 'http://host.docker.internal:6984'. Defaults to the credentials-stripped value of 'source_url',e.g., if the value of 'source_url' is 'http://admin:password@localhost:6984', then this option defaults to 'http://localhost:6984'.",
    defaultValueArg: "source_url",
    stripCredentialsFromDefaultValueUrl: true,
    validationFn: urlArgValidationFn,
  },
  targetUrlInsideExecutionServer: {
    name: "target_url_inside_execution_server",
    description:
      "Url of the target CouchDB server to be used when the cli connects to it from inside the execution server. This is especially useful when both, the source server and the target server, are running inside docker containers on the same machine. If passed, should be a valid url WITHOUT credentials, e.g., 'http://host.docker.internal:6984'. Defaults to the credentials-stripped value of 'target_url',e.g., if the value of 'target_url' is 'http://admin:password@localhost:6984', then this option defaults to 'http://localhost:6984'.",
    defaultValueArg: "target_url",
    stripCredentialsFromDefaultValueUrl: true,
    validationFn: urlArgValidationFn,
  },
}

module.exports = {
  helpArgConfig,
  versionArgConfig,
  mainArgsConfig,
}

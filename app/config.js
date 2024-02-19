const packageDotJson = require("../package.json")
const {
  urlArgValidationFn,
  listArgValidationFn,
  intArgValidationFn,
} = require("./utils")

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
      "Url of the CouchDB installation from where to clone dbs. Should be a valid url containing the server admin credentials, e.g., 'http://admin:password@localhost:5984'. If the credentials contain url-unsafe or reserved characters such as '@', pass the url-encoded value for those characters. So, e.g., if the server admin username is 'admin@example.com', the passed value of this option should be 'http://admin%40example.com:password@localhost:5984'.",
    required: true,
    validationFn: urlArgValidationFn,
  },
  targetUrl: {
    name: "target_url",
    description:
      "Url of the CouchDB installation where to clone dbs to. Should be a valid url containing the server admin credentials, e.g., 'http://admin:password@db.example.com'. If the credentials contain url-unsafe or reserved characters such as '@', pass the url-encoded value for those characters. So, e.g., if the server admin username is 'admin@example.com', the passed value of this option should be 'http://admin%40example.com:password@db.example.com'.",
    required: true,
    validationFn: urlArgValidationFn,
  },
  includeSecurityObjects: {
    name: "include_security_objects",
    description:
      "Whether to include the '_security' objects of dbs in the replication. If passed, should be either 'true' or 'false'. Note that if this option is 'true', the '_security' objects of dbs in the target server are overwritten by the '_security' objects of dbs in the source server. Defaults to 'true'.",
    defaultValue: true,
    validValues: ["true", "false"],
    sanitize: (val) => val === "true",
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
    description: `System dbs (those whose names begin with '_') other than '_users' (such as '_replicator' and '_global_changes') to be included in the replication. If passed, should be a comma-separated string of db names, e.g., 'non_users_system_dbs_to_include=_replicator,_global_changes'. Since ${packageDotJson.name} uses CouchDB's transient replication (i.e., there is no involvement of CouchDB's '_replicator' database), you most likely do not need to include the '_replicator' db in the replication. By default, no system dbs other than '_users' are included in the replication.`,
    defaultValue: [],
    validationFn: (val) =>
      listArgValidationFn(val) &&
      val.split(",").every((el) => el.startsWith("_")),
    sanitize: (val) => val.split(","),
  },
  nonSystemDbsToInclude: {
    name: "non_system_dbs_to_include",
    description:
      "A whitelist of non-system dbs (those whose names do not begin with '_') to be included in the replication. Use this option if you want to replicate only some non-system dbs. If passed, should be a comma-separated string of db names, e.g., 'non_system_dbs_to_include=db1,db2,db3'. By default, all non-system dbs are included in the replication.",
    defaultValue: [],
    validationFn: (val) =>
      listArgValidationFn(val) &&
      val.split(",").every((el) => !el.startsWith("_")),
    sanitize: (val) => val.split(","),
  },
  nonSystemDbsToExclude: {
    name: "non_system_dbs_to_exclude",
    description:
      "A whitelist of non-system dbs (those whose names do not begin with '_') to be excluded from the replication. Use this option if you want to replicate all except some non-system dbs. If passed, should be a comma-separated string of db names, e.g., 'non_system_dbs_to_exclude=db1,db2,db3'. By default, no non-system dbs are excluded from the replication.",
    defaultValue: [],
    validationFn: (val) =>
      listArgValidationFn(val) &&
      val.split(",").every((el) => !el.startsWith("_")),
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
      "Url of the source CouchDB server to be used when the cli connects to it from inside the execution server. This is especially useful in the following cases: (1) when the 'execution_server' is 'source', and the source server is running inside a docker container on localhost, and (2) when both, the source server and the target server, are running inside docker containers on localhost. If passed, should be a valid url WITHOUT credentials, e.g., 'http://host.docker.internal:6984'. Defaults to the credentials-stripped value of 'source_url',e.g., if the value of 'source_url' is 'http://admin:password@localhost:6984', then this option defaults to 'http://localhost:6984'.",
    defaultValueArg: "source_url",
    stripCredentialsFromDefaultValueUrl: true,
    validationFn: urlArgValidationFn,
  },
  targetUrlInsideExecutionServer: {
    name: "target_url_inside_execution_server",
    description:
      "Url of the target CouchDB server to be used when the cli connects to it from inside the execution server. This is especially useful in the following cases: (1) when the 'execution_server' is 'target', and the target server is running inside a docker container on localhost, and (2) when both, the source server and the target server, are running inside docker containers on localhost. If passed, should be a valid url WITHOUT credentials, e.g., 'http://host.docker.internal:6984'. Defaults to the credentials-stripped value of 'target_url',e.g., if the value of 'target_url' is 'http://admin:password@localhost:6984', then this option defaults to 'http://localhost:6984'.",
    defaultValueArg: "target_url",
    stripCredentialsFromDefaultValueUrl: true,
    validationFn: urlArgValidationFn,
  },
  batchSize: {
    name: "batch_size",
    description:
      "Number of dbs to replicate in parallel. A higher value means faster replication but also higher utilization of resources. A lower value means slower replication and better utilization of resources. If passed, should be between '1' and '250' inclusive. Defaults to '25'.",
    defaultValue: 25,
    validationFn: (val) => intArgValidationFn(val, 1, 250),
    sanitize: (val) => parseInt(val),
  },
}

module.exports = {
  helpArgConfig,
  versionArgConfig,
  mainArgsConfig,
}

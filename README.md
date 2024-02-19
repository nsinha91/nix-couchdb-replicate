A cli tool that does a one-off, one-way replication of all databases in one CouchDB installation to another CouchDB installation.

Although it is pretty simple to replicate a single database from one CouchDB installation to another (e.g., using CouchDB's Fauxton UI), it isn't as straightforward to replicate multiple databases together. This tool does just that.

An example of multiple databases in a CouchDB installation is when you have a per-user database for each user in your CouchDB.

### Install

```
npm i -g nix-couchdb-replicate
```

### Examples

Basic:

```
nix-couchdb-replicate \
	source_url=http://admin:password@localhost:5984 \
	target_url=http://admin:password@db.example.com
```

Including the _replicator and _global_changes dbs in the replication:

```
nix-couchdb-replicate \
	source_url=http://admin:password@localhost:5984 \
	target_url=http://admin:password@db.example.com \
	non_users_system_dbs_to_include=_replicator,_global_changes
```

Faster replication using a larger batch size:

```
nix-couchdb-replicate \
	source_url=http://admin:password@localhost:5984 \
	target_url=http://admin:password@db.example.com \
	batch_size=20
```

Replication when both, the source server and the target server, are running inside docker containers on localhost:

```
nix-couchdb-replicate \
	source_url=http://admin:password@localhost:5984 \
	target_url=http://admin:password@localhost:6984 \
	source_url_inside_execution_server=http://host.docker.internal:5984 \
	target_url_inside_execution_server=http://host.docker.internal:6984
```

### Options

| Name | Description | Required |
| --- | --- | --- |
| source_url | Url of the CouchDB installation from where to clone dbs. Should be a valid url containing the server admin credentials, e.g., 'http://admin:password@localhost:5984'. | Yes |
| target_url | Url of the CouchDB installation where to clone dbs to. Should be a valid url containing the server admin credentials, e.g., 'http://admin:password@db.example.com'. | Yes |
| include_security_objects | Whether to include the '_security' objects of dbs in the replication. If passed, should be either 'true' or 'false'. Note that if this option is 'true', the '_security' objects of dbs in the target server are overwritten by the '_security' objects of dbs in the source server. Defaults to 'true'. | No |
| include_users_db | Whether to include the '_users' db in the replication. If passed, should be either 'true' or 'false'. Defaults to 'true'. | No |
| non_users_system_dbs_to_include | System dbs (those whose names begin with '_') other than '_users' (such as '_replicator' and '_global_changes') to be included in the replication. If passed, should be a comma-separated string of db names, e.g., 'non_users_system_dbs_to_include=_replicator,_global_changes'. Since nix-couchdb-replicate uses CouchDB's transient replication (i.e., there is no involvement of CouchDB's '_replicator' database), you most likely do not need to include the '_replicator' db in the replication. By default, no system dbs other than '_users' are included in the replication. | No |
| non_system_dbs_to_include | A whitelist of non-system dbs (those whose names do not begin with '_') to be included in the replication. Use this option if you want to replicate only some non-system dbs. If passed, should be a comma-separated string of db names, e.g., 'non_system_dbs_to_include=db1,db2,db3'. By default, all non-system dbs are included in the replication. | No |
| non_system_dbs_to_exclude | A whitelist of non-system dbs (those whose names do not begin with '_') to be excluded from the replication. Use this option if you want to replicate all except some non-system dbs. If passed, should be a comma-separated string of db names, e.g., 'non_system_dbs_to_exclude=db1,db2,db3'. By default, no non-system dbs are excluded from the replication. | No |
| execution_server | Server on which to execute the call to CouchDB's '_replicate' api. If passed, should be either 'source' or 'target'. Defaults to 'source'. | No |
| source_url_inside_execution_server | Url of the source CouchDB server to be used when the cli connects to it from inside the execution server. This is especially useful when both, the source server and the target server, are running inside docker containers on the same machine. If passed, should be a valid url WITHOUT credentials, e.g., 'http://host.docker.internal:6984'. Defaults to the credentials-stripped value of 'source_url',e.g., if the value of 'source_url' is 'http://admin:password@localhost:6984', then this option defaults to 'http://localhost:6984'. | No |
| target_url_inside_execution_server | Url of the target CouchDB server to be used when the cli connects to it from inside the execution server. This is especially useful when both, the source server and the target server, are running inside docker containers on the same machine. If passed, should be a valid url WITHOUT credentials, e.g., 'http://host.docker.internal:6984'. Defaults to the credentials-stripped value of 'target_url',e.g., if the value of 'target_url' is 'http://admin:password@localhost:6984', then this option defaults to 'http://localhost:6984'. | No |
| batch_size | Number of dbs to replicate in parallel. A higher value means faster replication but also higher utilization of resources. A lower value means slower replication and better utilization of resources. If passed, should be between '1' and '250' inclusive. Defaults to '25'. | No |
### Other Options

```
nix-couchdb-replicate --help
```

```
nix-couchdb-replicate --version
```


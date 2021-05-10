# nix-couchdb-replicate

A command line tool that does a one-off replication of all databases in one CouchDB installation to another CouchDB installation.

Although it is pretty simple to replicate a single database from one CouchDB installation to another (e.g., using CouchDB's Fauxton UI), it isn't as straightforward to replicate multiple databases together. This tool does just that.

*An example of multiple databases in a CouchDB installation is when you have a per-user database for each user in your CouchDB.*

## Install

```
npm i -g nix-couchdb-replicate
```

## Examples

Basic:
```
nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984
```

When target is a local installation:
```
nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@localhost:5984 use_target_replicator=true
```

Faster replication using a larger batch size:
```
nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 batch_size=20
```

Skipping the _replicator and _users dbs for replication:
```
nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 skip_dbs=_replicator,_users
```

## Options

Name|Description|Value|Default Value|Required
---|---|---|---|---
source_url|Url of the CouchDB installation from where to clone dbs.|URL||Yes
target_url|Url of the CouchDB installation where to clone dbs to.|URL||Yes
batch_size|Number of dbs to clone in parallel. A higher value means faster replication but also higher utilization of resources. A lower value means slower replication and better utilization of resources.|Number|5|No
skip_dbs|The dbs to not be included in the replication.|Comma-separated database names|_replicator|No
use_target_replicator| Whether to use the _replicator database of the target for replication. This is useful when the target is a localhost url. By default, the _replicator database of the source is used.|true/false|false|No

### Other Options
```
nix-couchdb-replicate --help
```
```
nix-couchdb-replicate --version
```
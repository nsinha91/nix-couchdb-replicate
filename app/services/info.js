const packageDotJson = require("../../package.json")

const showHelpInfo = ({ argsConfig }) => {
  console.log("\nDESCRIPTION:")
  console.log(`${packageDotJson.description}`)
  console.log("\nUSAGE:")
  console.log("nix-couchdb-replicate <option1>=<value1> <option2>=<value2> ...")
  console.log("\nEXAMPLE USAGE:")
  console.log(
    "nix-couchdb-replicate source_url=http://admin:password@localhost:5984 target_url=http://admin:password@db.example.com"
  )
  console.log("\nOPTIONS:")
  for (const argConfig of Object.values(argsConfig)) {
    console.log(`${argConfig.name}${argConfig.required ? "*" : ""}`)
    console.log(`> ${argConfig.description}`)
    if (argConfig.validValues) {
      console.log(`> Possible values = ${argConfig.validValues.join(", ")}`)
    }
    console.log("")
  }
  console.log("MORE EXAMPLES:")
  console.log("-> When target is a local installation:")
  console.log(
    "nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@localhost:5984 use_target_replicator=true"
  )
  console.log("-> Faster replication using a larger batch size:")
  console.log(
    "nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 batch_size=20"
  )
  console.log("-> Skipping the _replicator and _users dbs for replication:")
  console.log(
    "nix-couchdb-replicate source_url=https://admin:password@12.34.56.78:6984 target_url=http://admin:password@98.76.54.32:5984 skip_dbs=_replicator,_users"
  )
}

const showVersionInfo = () => {
  console.log(packageDotJson.version)
}

module.exports = {
  showHelpInfo,
  showVersionInfo,
}

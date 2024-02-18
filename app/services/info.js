const packageDotJson = require("../../package.json")

const showHelpInfo = ({ argsConfig }) => {
  console.log("\nDESCRIPTION:")
  console.log(`${packageDotJson.description}`)
  console.log("\nUSAGE:")
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
}

const showVersionInfo = () => {
  console.log(packageDotJson.version)
}

module.exports = {
  showHelpInfo,
  showVersionInfo,
}

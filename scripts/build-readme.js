const fs = require("fs")
const {
  mainArgsConfig,
  helpArgConfig,
  versionArgConfig,
} = require("../app/config")
const packageDotJson = require("../package.json")

const readmeConfig = {
  introSection: [
    { text: `${packageDotJson.description}.` },
    {
      text: "Although it is pretty simple to replicate a single database from one CouchDB installation to another (e.g., using CouchDB's Fauxton UI), it isn't as straightforward to replicate multiple databases together. This tool does just that.",
    },
    {
      text: "An example of multiple databases in a CouchDB installation is when you have a per-user database for each user in your CouchDB.",
    },
  ],
  installSection: [
    { header: "Install" },
    { code: `npm i -g ${packageDotJson.name}` },
  ],
  examplesSection: [
    { header: "Examples" },
    { text: "Basic:" },
    {
      code: `${packageDotJson.name} \\\n\tsource_url=http://admin:password@localhost:5984 \\\n\ttarget_url=http://admin:password@db.example.com`,
    },
    {
      text: "Including the _replicator and _global_changes dbs in the replication:",
    },
    {
      code: `${packageDotJson.name} \\\n\tsource_url=http://admin:password@localhost:5984 \\\n\ttarget_url=http://admin:password@db.example.com \\\n\tnon_users_system_dbs_to_include=_replicator,_global_changes`,
    },
    { text: "Faster replication using a larger batch size:" },
    {
      code: `${packageDotJson.name} \\\n\tsource_url=http://admin:password@localhost:5984 \\\n\ttarget_url=http://admin:password@db.example.com \\\n\tbatch_size=20`,
    },
    {
      text: "Replication when both, the source server and the target server, are running inside docker containers on localhost:",
    },
    {
      code: `${packageDotJson.name} \\\n\tsource_url=http://admin:password@localhost:5984 \\\n\ttarget_url=http://admin:password@localhost:6984 \\\n\tsource_url_inside_execution_server=http://host.docker.internal:5984 \\\n\ttarget_url_inside_execution_server=http://host.docker.internal:6984`,
    },
  ],
  optionsSection: [
    { header: "Options" },
    {
      table: {
        headers: ["Name", "Description", "Required"],
        body: Object.values(mainArgsConfig).map((mainArgConfig) => [
          mainArgConfig.name,
          mainArgConfig.description,
          mainArgConfig.required ? "Yes" : "No",
        ]),
      },
    },
  ],
  otherOptionsSection: [
    { header: "Other Options" },
    { code: `${packageDotJson.name} ${helpArgConfig.names[1]}` },
    { code: `${packageDotJson.name} ${versionArgConfig.names[1]}` },
  ],
}

const buildReadme = () => {
  let mdText = ""
  for (const section of Object.values(readmeConfig)) {
    for (const item of section) {
      const [itemName, itemValue] = Object.entries(item)[0]
      switch (itemName) {
        case "header":
          mdText += `### ${itemValue}\n\n`
          break
        case "text":
          mdText += `${itemValue}\n\n`
          break
        case "code":
          mdText += `\`\`\`\n${itemValue}\n\`\`\`\n\n`
          break
        case "table":
          for (const header of itemValue.headers) {
            mdText += `| ${header} `
          }
          mdText += "|\n"
          mdText += itemValue.headers.map((el) => `| --- `).join("")
          mdText += "|\n"
          for (const row of itemValue.body) {
            for (const columnValue of row) {
              mdText += `| ${columnValue} `
            }
            mdText += "|\n"
          }
          break
        default:
          break
      }
    }
  }
  console.log(mdText)
  fs.writeFileSync("README.md", mdText)
}

buildReadme()

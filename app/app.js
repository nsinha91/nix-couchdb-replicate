const { getAllDbNames, replicateDb } = require("./services")

;(async () => {
  try {
    console.log(1, await getAllDbNames())
    console.log(2, await replicateDb())
  } catch (err) {
    console.error(err)
  }
})()

// -- Configure env --
require("dotenv").config()

// -- Declare variables --
const {
  TEST_DB_1_PORT,
  TEST_DB_2_PORT,
  TEST_DB_ADMIN_USER,
  TEST_DB_ADMIN_PASSWORD,
} = process.env
const testDb1Url = `http://localhost:${TEST_DB_1_PORT}`
const testDb2Url = `http://localhost:${TEST_DB_2_PORT}`

// -- Helpers --
const createDb = async ({ baseUrl, name }) => {
  const response = await fetch(`${baseUrl}/${name}`, {
    method: "PUT",
    headers: new Headers({
      Authorization:
        "Basic " + btoa(`${TEST_DB_ADMIN_USER}:${TEST_DB_ADMIN_PASSWORD}`),
    }),
  })
  if (!response.ok) {
    throw new Error(await response.text())
  }
}

// -- Run --
;(async () => {
  try {
    // -- Create _users dbs --
    await createDb({ baseUrl: testDb1Url, name: "_users" })
    await createDb({ baseUrl: testDb2Url, name: "_users" })
  } catch (err) {
    console.error(err)
  }
})()

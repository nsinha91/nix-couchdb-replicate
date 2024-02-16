const getAllDbNames = async () => {
  const response = await fetch(`http://localhost:5994/_all_dbs`, {
    method: "GET",
    headers: new Headers({
      Authorization: "Basic " + btoa(`nikhil:30091991`),
    }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(await response.text())
  }
}

const replicateDb = async () => {
  const response = await fetch(`http://localhost:5994/_replicate`, {
    method: "POST",
    headers: new Headers({
      Authorization: "Basic " + btoa(`nikhil:30091991`),
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      create_target: true,
      source: {
        url: "http://host.docker.internal:5995/db4",
        headers: {
          Authorization: "Basic " + btoa("nikhil:30091991"),
        },
      },
      target: {
        url: "http://host.docker.internal:5994/db4",
        headers: {
          Authorization: "Basic " + btoa(`nikhil:30091991`),
        },
      },
    }),
  })
  if (response.ok) {
    return await response.json()
  } else {
    throw new Error(await response.text())
  }
}

module.exports = {
  getAllDbNames,
  replicateDb,
}

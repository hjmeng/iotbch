iotbch
======

BCHDevcon 2019 Hackathon Project

# Goal

Provide a simple API for any IoT device to post data feed to store compressed data on BCH.
Provide enterprise grade tool to visualize the data.

# Tasks

1. Obtain Purple Air data feed from https://github.com/bomeara/purpleairpy/blob/master/api.md
2. Sample 4 devices [devices.json](./devices.json)
3. Post datafeed to IOTBCH API
* Create a template from the json datafeed.
* Compress the datafeed.
* Store the template on database AWS.
* Push compressed data to BCH testnet in the OP_RETURN field
4. Reconstruction
* Retrieve compressed data from BCH OP_RETURN.
* Retrieve template from AWS to reconstruct original datafeed in json.
5. Analytics tool to visualize reconstructed datafeed


# Examples

Split Transaction

```js
const API_KEY = "****";
const fetch = require('node-fetch');
const query = function(hash) {
  return {
    init: {
      "v": 3, "q": { "find": { "tx.h": hash }, "limit": 1 },
      "r": { "f": "{ prev: .[0].in[0].e.h, size: .[0].out[0].h3, lastChunk: .[0].out[0].s10 }" }
    },
    next: {
      "v": 3, "q": { "find": { "tx.h": hash }, "limit": 1 },
      "r": { "f": "{tx: .[0].in[0].e.h, content: .[0].out[0].s1}" }
    }
  }
}
const read = async function(q) {
  let b64 = Buffer.from(JSON.stringify(q)).toString("base64");
  let result = await fetch("https://bitdb.network/q/" + b64, { headers: { key: API_KEY } })
  return result.json()
}
const next = async function(hash, counter) {
  let res = await read(query(hash).next)
  if (counter > 0) {
    let next_res = await next(res.c.tx, counter-1)
    return next_res.concat(res.c.content)
  } else {
    return [res.c.content]
  }
};
const get = function(hash) {
  return new Promise(async function(resolve, reject) {
    let file = await read(query(hash).init)
    let chunks = await next(file.c.prev, parseInt(file.c.size, 16) - 1)
    resolve(chunks.concat(file.c.lastChunk))
  })
}
get("85a56dbddb02b1447ee2a81e28642518af1c3896b3ac2c28465284af454c3a13").then(function(chunks) {
  console.log(chunks.join(""))
})
```

[BCH stress test code](https://github.com/SpendBCH/bch-stresstest-web/blob/master/src/stresstest-lib/utils.js#L39)

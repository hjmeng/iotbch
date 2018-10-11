iotbch
======

BCHDevcon 2019 Hackathon Project

# Introduction

Internet of Things (IoT) is gaining popularity. A good example is PurpleAir.com. Users buy a PurpleAir
air pollution monitor and connect to their wifi. The monitor submits PM2.5 data to PurpleAir server. However, the user does not have many options when it comes to analyzing their own data or their neighborhood data.

# Goal

Provide a simple API for any IoT device to post data on BCH.
Compress the raw IoT data to fully utilize the OP_RETURN field.
Provide enterprise grade tool to analyze and visualize the data.

# Benefits
* Permanent storage on BCH for user generated IoT
* Bring ETL tool to BCH to organize the OP_RETURN


# Tasks

1. Obtain Purple Air data feed from https://github.com/bomeara/purpleairpy/blob/master/api.md
2. Sample 4 devices [devices.json](./devices.json)
3. Post datafeed to IoTBCH API
* Create a [template](./protobuf/metrics.proto)) from the json datafeed.
* Compress the datafeed into byte stream.
* Push compressed data to BCH testnet in the OP_RETURN field

{ blockchain: 'BCH',
  to_addr: 'qr8ngds6j7ww428mud7fz376z5vj0dn4mgx32xuv9a',
    message: <Buffer 49 6f 54 0a 09 70 75 72 70 6c 65 61 69 72 10 c9 7d 1a 06 08 a
    5 b7 fd dd 05 1a 06 08 f5 b7 fd dd 05 1a 06 08 c5 b8 fd dd 05 1a 06 08 95 b9 fd
    dd 05 1a ... > }
    { txid: '698f2d7a54219f0df4c40d257fcdec64249e449d75ceac82ab6c3a0b430b4a14',
      vout: 2,
        address: 'bchtest:qq3v84fq63r09x2uwrvkf6h0uwzcm93hhutk2md8vn',
	  account: '',
	    scriptPubKey: '76a91422c3d520d446f2995c70d964eaefe3858d9637bf88ac',
	      amount: 0.18750096,
	        confirmations: 18,
		  spendable: true,
		    solvable: true,
		      safe: true }


TXID on testnet

4531054d6b6a55796110d193b74ccccfde6149ec292d513d2c581aba48e82713

https://www.blocktrail.com/tBCC/tx/4531054d6b6a55796110d193b74ccccfde6149ec292d513d2c581aba48e82713

4. Reconstruction
* Retrieve compressed data from BCH OP_RETURN.
* Retrieve template from AWS to reconstruct original datafeed in json.
5. Analytics tool to visualize reconstructed datafeed


# Getting Started

## run RPC server

1. `npm install`
2. `npm run server`

## run daemon to fetch device metrics (in separate tab)

1. compile feed fetcher daemon `GOOS=linux GOARCH=amd64 go build -o publish-feed-linux-amd64 .`
2. run `./publish-feed-linux-amd64`


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

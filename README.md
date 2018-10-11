iotbch
======

BCHDevcon 2019 Hackathon Project

# Introduction

Internet of Things (IoT) is gaining popularity. A good example is [PurpleAir.com](https://www.purpleair.com/map#12.58/37.43558/-122.15637). Users buy a PurpleAir air pollution monitor and connect it to their wifi. The monitor submits PM2.5 data to PurpleAir server periodically. However, the user does not have many options when it comes to analyzing their own data or their neighborhood's data.

# Goal

Provide a simple API for any IoT device to post data on BCH.
Compress the raw IoT data to fully utilize the OP_RETURN field.
Provide enterprise grade tool to analyze and visualize the data.

# Benefits
* Permanent storage on BCH for user generated IoT data
* Bring ETL tool to BCH to organize the OP_RETURN
* Personalized analytics 

# Tasks for Hackathon

- [x] Obtain Purple Air data feed from https://github.com/bomeara/purpleairpy/blob/master/api.md
- [x] Select sample 4 devices [devices.json](./devices.json)
- [x] Post datafeed to IoTBCH
- [x] Create a [template](./protobuf/metrics.proto)) from the json datafeed
- [x] Compress the datafeed into byte stream.
- [x] Push compressed data to BCH testnet in the OP_RETURN field
- [ ] Reconstruct feed from BCH OP_RETURN
- [x] Analytics tool to visualize datafeed

# Getting Started

## run RPC server

1. `npm install`
2. `npm run server`

## run daemon to fetch device metrics (in separate tab)

1. compile feed fetcher daemon `GOOS=linux GOARCH=amd64 go build -o publish-feed-linux-amd64 .`
2. run `./publish-feed-linux-amd64`


# `OP_RETURN` schema + compression

For PurpleAir metrics we store a Protobuf binary serialized representation of
the following:

```
{
  device: "AirMonitor_1f12",
  id: 123,
  lat: 37.435972,
  lon: -122.129822,
  temp_f: 87,
  feed: [
    { ts: <start unix time>, pm2.5: <float> },
    { ts: <diff from start unix time>, pm2.5: <float> },
    { ts: <diff from start unix time>, pm2.5: <float> },
    ...
  ]
}
```

# Examples

```
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
```


## TXID on testnet

[4531054d6b6a55796110d193b74ccccfde6149ec292d513d2c581aba48e82713](https://www.blocktrail.com/tBCC/tx/4531054d6b6a55796110d193b74ccccfde6149ec292d513d2c581aba48e82713)

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

var PROTO_PATH = __dirname + '/protobuf/metrics.proto';
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var util = require('./utility.js');
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
var deviceMetrics = protoDescriptor.DeviceMetrics;

async function addDeviceMetrics(call) {
  message = call.request.feed[0];
  console.log(message);
  try {
    var tx = await util.sendTX({
      "blockchain": 'BCH',
      "to_addr": "qr8ngds6j7ww428mud7fz376z5vj0dn4mgx32xuv9a",
      "message": "IoT"+message
    });
    var txid = tx.id;
  } catch (error) {
    console.log(error);
  }
  console.log(txid);
}

var Server = new grpc.Server();
Server.addService(deviceMetrics.service, {
  addDeviceMetrics: addDeviceMetrics
});

var port = "50051"
console.log(`RPC listening on ${port}`);
Server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
Server.start();

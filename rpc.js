var PROTO_PATH = __dirname + '/protobuf/metrics.proto';
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
var deviceMetrics = protoDescriptor.DeviceMetrics;

function addDeviceMetrics(call) {
  // TODO: do something w/ this data
  console.log(call.request);
}

var Server = new grpc.Server();
Server.addService(deviceMetrics.service, {
  addDeviceMetrics: addDeviceMetrics
});

var port = "50051"
console.log(`RPC listening on ${port}`);
Server.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
Server.start();

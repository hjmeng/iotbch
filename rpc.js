var PROTO_PATH = __dirname + '/protobuf/metrics.proto';
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');
var util = require('./utility.js');
var pb = require('./protobuf/metrics_pb.js')
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
  var feed = new pb.Feed;
  feed.setDeviceId(call.request.feed.device_id);
  feed.setTemplateId("purpleair");
  var message;
  call.request.feed.feed_items.forEach((f) => {
    var feedItem = new pb.FeedItem;
    feedItem.setTs(f["ts"]);
    feedItem.setPm25(f["pm_2.5"]);

    feed.addFeedItems(feedItem);
    message = feed.serializeBinary();
  });

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

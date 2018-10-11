var util = require('./utility.js');

var appRouter = function (app) {

    app.get("/", function (req, res) {
	res.status(200).send({ message: 'Welcome to IoTBCH restful API' });
    });

    
    app.post('/feed', async function(request, response){
/*	console.log(request.body);      // your JSON
	try {
	    var data = JSON.parse(request.body);
	} catch (error ) {
	    console.log(error);
	}
*/
	//var device = data.device;
	//var feed = data.feed;

	// encode feed
	// var message = encode(feed);

	var message = "test 3...............";
	// send message to BCH
	try {
	    var tx = await util.sendTX({
		"blockchain": 'BCH',
		"to_addr": "qr8ngds6j7ww428mud7fz376z5vj0dn4mgx32xuv9a",
		"message": "IoT"+message});
	    var txid = tx.id;
	} catch (error) {
	    console.log(error);
	}
	console.log(txid);
    });
}

module.exports = appRouter;

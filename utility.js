"use strict";
require('dotenv').config()

module.exports.sendTX = async function (params) {
    //  params:  to_addr, message, blockchain
    console.log(params);
    const Client = require('bitcoin-core');
    const bch = require('bitcoincashjs');
    var dash = require('dashcore-lib');
    var Unit = dash.Unit;
    var bchaddr = require('bchaddrjs');

    const client = new Client({
	agentOptions: true,
	headers: false,
	host: process.env[params.blockchain+"_HOST"],
	network: process.env[params.blockchain+"_NETWORK"],
	username: process.env[params.blockchain+"_USERNAME"],
	password: process.env[params.blockchain+"_PASSWORD"],
	port: process.env[params.blockchain+"_PORT"],
	ssl: false,
	timeout: 30000,
    });


    var utoxs = await client.listUnspent();
    for(var val of utoxs) {
        if (val.amount>0.0001) {
            var addr = (params.blockchain=="BCH")? val.address.substring(8):val.address
	    var unspent = val
            break
        }
    }

    console.log(unspent);
    
    if (unspent == null) {
	throw "Insufficient balance to send transaction";
    }

    var changeaddr = await client.getNewAddress();
    var change = Unit.fromBTC(unspent.amount).toSatoshis()-15000;
    var privkey = await client.dumpPrivKey(addr);

    /*
    console.log("changeaddr: " + changeaddr)
    console.log("addr: " + addr)
    console.log("privkey: " + privkey)
    */
    
    if (params.blockchain == 'BCH') {
	const utxo = {
            'txId' : unspent.txid,
            'outputIndex' : unspent.vout,
            'address' : bchaddr.toLegacyAddress(addr),
            'script' : unspent.scriptPubKey,
            'satoshis' : Unit.fromBTC(unspent.amount).toSatoshis()
	}
	const tx = new bch.Transaction()
              .from(utxo)
              .to(bchaddr.toLegacyAddress(params.to_addr), 1)
              .change(bchaddr.toLegacyAddress(changeaddr))
              .addData(params.message)
              .sign(privkey);
	var transactionhex = tx.toString();
    }
    try {
	var txid = await client.sendRawTransaction(transactionhex, true)
	return {id: txid}
    } catch (error) {
	throw error.message;
    }
}



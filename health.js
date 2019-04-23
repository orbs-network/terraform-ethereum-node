const http = require('http');
const execSync = require('child_process').execSync;

var server = http.createServer((function (_, response) {
    // Check if ethereum is synced
    const result = execSync(`curl -s --data '{"method":"eth_syncing","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://localhost:8545`);
    const resultAsString = result.toString();
    const o = JSON.parse(resultAsString);
    const returnValue = {
        ok: false
    };

    if (o.result === false) { // This means ethereum is synced with the network
        returnValue.ok = true;
        returnValue.message = 'Ethereum has is now fully synced with the mainnet!';
    } else {
        if (o.result.highestBlock === '0x0') {
            returnValue.message = 'Ethereum is downloading an initial snapshot, and will soon start syncing blocks';
        } else {
            returnValue.message = 'Ethereum sync in progress';
            returnValue.blocksRemainingToSync = parseInt(o.result.highestBlock) - parseInt(o.result.currentBlock);
        }
    }

    const resultStatus = (returnValue.ok === true) ? 200 : 503;
    response.writeHead(resultStatus, { "Content-Type": "application/json" });
    response.end(JSON.stringify(returnValue));
}));
server.listen(8080);
const http = require('http');
const execSync = require('child_process').execSync;
const { getLatestBlockHeaders, getMachineCurrentTime } = require('./ethereum-lib');

function getEthSyncing() {
    const result = execSync(`curl -s --data '{"method":"eth_syncing","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://localhost:8545`);
    const resultAsString = result.toString();
    return JSON.parse(resultAsString);
}

function getParityChainStatus() {
    const result = execSync(`curl -s --data '{"method":"parity_chainStatus","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://localhost:8545`);
    const resultAsString = result.toString();
    return JSON.parse(resultAsString);
}

var server = http.createServer((function (_, response) {
    // Check if ethereum is synced
    const ethSyncing = getEthSyncing();
    const parityChainStatus = getParityChainStatus();

    const latestBlock = getLatestBlockHeaders();
    const latestBlockTimestamp = parseInt(latestBlock.result.timestamp);
    const currentMachineTimestamp = getMachineCurrentTime();

    const returnValue = {
        ok: (Math.abs(currentMachineTimestamp - latestBlockTimestamp)) < 5 * 60, // the health check should fail if 5 minutes
        blockNumber: parseInt(latestBlock.result.number),
        latestBlockTimestamp,
        currentMachineTimestamp,
        timeDriftInSeconds: currentMachineTimestamp - latestBlockTimestamp,
    };

    if (returnValue.ok) {
        returnValue.message = 'Ethereum is now fully synced with the mainnet!';
    }

    if (ethSyncing.result === false && parityChainStatus.result.blockGap === null) { // This means ethereum is synced with the network
    } else {
        if (ethSyncing.result.highestBlock === '0x0') {
            returnValue.message = 'Ethereum is downloading an initial snapshot, and will soon start syncing blocks';
        } else {
            returnValue.message = 'Ethereum sync in progress';
            returnValue.blocksRemainingToSync = parseInt(ethSyncing.result.highestBlock) - parseInt(ethSyncing.result.currentBlock);
            returnValue.blockGap = parityChainStatus.result.blockGap;
        }
    }

    const resultStatus = (returnValue.ok === true) ? 200 : 503;
    response.writeHead(resultStatus, { "Content-Type": "application/json" });
    response.end(JSON.stringify(returnValue));
}));
server.listen(8080);
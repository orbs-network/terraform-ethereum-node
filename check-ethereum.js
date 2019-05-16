const { stuckWhileSyncingCertainBlock,
    stuckWhileSyncingPeriodicSnapshot,
    timeLog,
    stuckWhileSyncingSnapshot,
    restartEthereum,
    getLastEthereumLogs, } = require('./ethereum-lib');
const execSync = require('child_process').execSync;

const commandAsString = `curl -s --data '{"method":"eth_syncing","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://localhost:8545`;

var shouldRestart = false;
var resultAsString;

// Check if ethereum is synced
try {
    const result = execSync(commandAsString, {
        timeout: 10 * 1000
    });
    resultAsString = result.toString();
} catch (err) {
    // If we can't reach the Ethereum node to figure out it's sync status
    // Or if we encountered any other kind of error, restart the node.
    shouldRestart = true;
}

const o = JSON.parse(resultAsString);

if (o.result === false) { // This means ethereum is synced with the network
    timeLog('Ethereum is synced, no need to do anything, quiting..');
} else {
    if (o.result.highestBlock === '0x0') { // Downloading snapshot
        timeLog('Ethereum is syncing the initial snapshot, checking if it is not stuck..');

        // If Ethereum is stuck syncing the latest snapshot - restart it
        if (stuckWhileSyncingSnapshot(getLastEthereumLogs(500))) {
            shouldRestart = true;
        }
    } else {
        timeLog('Parity looks like its business as usual, lets run its logs past one more analysis..');
        const resultStuckOnSpecificBlock = stuckWhileSyncingCertainBlock(getLastEthereumLogs(500));
        const resultStuckOnPeriodicSnapshot = stuckWhileSyncingPeriodicSnapshot(getLastEthereumLogs(500));

        if (resultStuckOnSpecificBlock.ok) {
            shouldRestart = true;
            timeLog(resultStuckOnSpecificBlock.message);
        } else if (resultStuckOnPeriodicSnapshot.ok) {
            shouldRestart = true;
            timeLog(resultStuckOnPeriodicSnapshot.message);
        } else {
            let blocksRemainingToSync = parseInt(o.result.highestBlock) - parseInt(o.result.currentBlock);
            timeLog(`Ethereum is syncing and has ${blocksRemainingToSync} blocks remaining to sync, quiting..`);
        }
    }
}

if (shouldRestart) {
    timeLog('Restarting Ethereum...');
    timeLog(restartEthereum().toString());
}

process.exit(0);


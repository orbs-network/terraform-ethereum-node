const execSync = require('child_process').execSync;
const commandAsString = `curl -s --data '{"method":"eth_syncing","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://localhost:8545`;

function restartEthereum() {
    return execSync('./restart-parity.sh', {
        cwd: '/home/ubuntu'
    });
}

function getLastEthereumLogs(n = 100) {
    const result = execSync(`tail -n ${n} /var/log/ethereum.err.log`);
    const resultAsString = result.toString();
    return resultAsString.split('\n');
}

/**
 * Checks iteratively if we are stuck on a specific piece of the snapshot
 * @param {*} logs 
 */
function stuckWhileSyncing(logs) {
    let currentSnapshotFigure = 'xxxx';
    let appearances = 0;

    logs.forEach((log) => {
        const logParts = log.split(' ');
        if (logParts[3] === 'Syncing' && logParts[4] === 'snapshot') {
            if (currentSnapshotFigure !== logParts[5]) { // New snapshot figure detected!
                currentSnapshotFigure = logParts[5];
                appearances = 1;
                continue;
            } else if (currentSnapshotFigure === logParts[5]) {
                appearances++;
            }
        }
    });

    if (appearances > 50) {
        return true;
    }
    return false;
}

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
    console.log('Ethereum is synced, no need to do anything, quiting..');
} else {
    if (o.result.highestBlock === '0x0') { // Downloading snapshot
        console.log('Ethereum is syncing the initial snapshot, checking if it is not stuck..');

        // If Ethereum is stuck syncing the latest snapshot - restart it
        if (stuckWhileSyncing(getLastEthereumLogs(500))) {
            shouldRestart = true;
        }
    } else {
        let blocksRemainingToSync = parseInt(o.result.highestBlock) - parseInt(o.result.currentBlock);
        console.log(`Ethereum is syncing and has ${blocksRemainingToSync} blocks remaining to sync, quiting..`);

    }
}

if (true) {
    console.log('Restarting Ethereum...');
    console.log(restartEthereum().toString());
}

process.exit(0);


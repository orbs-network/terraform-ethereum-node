const execSync = require('child_process').execSync;
const os = require('os');

// Read a url from the environment variables
const slackUrl = process.argv[2];

function notifyManagerInitiatedRestartToSlack(managerMessage) {
    if (slackUrl !== undefined) {
        const baseCommand = 'curl -s -X POST --data-urlencode "payload={\\"channel\\": \\"#prod-monitoring\\", \\"username\\": \\"eth-manager\\", \\"text\\": \\"[*' + os.hostname() + '*] ' + managerMessage + '\\" ' + slackUrl;
        execSync(baseCommand);
    }
}

function getLatestBlockHeaders() {
    const result = execSync(`curl -s --data '{"method":"eth_getBlockByNumber","params":["latest", false],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST http://localhost:8545`);
    const resultAsString = result.toString();
    return JSON.parse(resultAsString);
}

function getLatestBlockTimestamp() {
    return parseInt(getLatestBlockHeaders().result.timestamp);
}

function getMachineCurrentTime() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Check iteratively if we are stuck syncing a specific block number
 */
function stuckWhileSyncingCertainBlock(logs) {
    let ok = false;
    let message = 'The process does not seem to be stuck on any particular block';
    let blockNumber = 'xxxx';
    let syncLogsCounter = 0;
    const stuckBarrier = 100;

    logs.forEach((logLine) => {
        const logLineAsArray = logLine.split(' ');

        if (logLineAsArray[3] === 'Syncing' && logLineAsArray[4].substr(0, 1) === '#') { // Identify the line is a syncing block line
            if (blockNumber === logLineAsArray[4] + ' ' + logLineAsArray[5]) {
                // Still stuck on the same block
                syncLogsCounter++;
            } else {
                // Switched to new block
                blockNumber = logLineAsArray[4] + ' ' + logLineAsArray[5];
                syncLogsCounter = 1;
            }
        }
    });

    if (syncLogsCounter >= stuckBarrier) { // This process is definitely stuck on block sync!
        ok = true;
        message = `The process is stuck while attempting to sync block ${blockNumber}`;
    }

    return {
        ok,
        message,
        blockNumber,
        syncLogsCounter,
    };
}

function timeLog(message) {
    console.log(`[${new Date()}] ${message}`);
}

function restartEthereum() {
    return execSync('./restart-parity.sh', {
        cwd: '/home/ubuntu'
    });
}

function upgradeEthereum(installUrl) {
    return execSync(`./upgrade-parity.sh ${installUrl}`, {
        cwd: '/home/ubuntu'
    });
}

function rollbackEthereum() {
    return execSync(`./recover-from-failed-upgrade.sh`, {
        cwd: '/home/ubuntu'
    });
}

// We can only run on the last maximum 720 lines
// since parity writes a log line every 5 seconds so that's 720 lines in 1 hour
// we shouldn't pull more to not overlap our decisions from the last run of this script
function getLastEthereumLogs(n = 500) {
    const result = execSync(`tail -n ${n} /var/log/ethereum.err.log`);
    const resultAsString = result.toString();
    return resultAsString.split('\n');
}

/**
 * Checks iteratively if we are stuck on a specific piece of the snapshot
 * @param {*} logs 
 */
function stuckWhileSyncingSnapshot(logs) {
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

function stuckWhileSyncingPeriodicSnapshot(logs) {
    let ok = false;
    let message = 'Not stuck on periodic snapshot as it appears';
    let snapshotNumber = 'xxxx';
    let logsCounter = 0;
    const stuckBarrier = 35;

    logs.forEach((logLine) => {
        const logLineAsArray = logLine.split(' ');

        if (logLineAsArray[3] === 'Snapshot:') { // Identify the line is a periodic Snapshot log line
            if (snapshotNumber === logLineAsArray[4]) {
                // Still stuck on the same snapshot number
                logsCounter++;
            } else {
                // Switched to new snapshot number
                snapshotNumber = logLineAsArray[4];
                logsCounter = 1;
            }
        }
    });

    if (logsCounter >= stuckBarrier) { // This process is definitely stuck on periodic snapshot!
        ok = true;
        message = `The process is stuck while attempting to sync snapshot #${snapshotNumber}`;
    }

    return {
        ok,
        message,
    };
}

function getLatestFromHaystack(releases, type = 'stable') {
    for (let n in releases) {
        if (releases[n].name.indexOf(type) !== -1) {
            return releases[n];
        }
    }
    return false;
}

function getLinuxUrlFromReleaseHtml(body = '') {
    return body
        .match(/\[parity\]\(.*\)/g)
        .filter(ml => ml.indexOf('linux') !== -1)[0]
        .replace('[parity]', '')
        .replace(/\(|\)/g, '');
}

const regExExtractParitySemver = /v(([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9a-zA-Z]+))?)/;

function sanitizeVersion(version) {
    return version
        .replace('-beta', '')
        .replace('-stable', '');
}

function getInstalledParityVersion(commandAsString = 'parity --version') {
    return sanitizeVersion(execSync(commandAsString, {
        cwd: '/home/ubuntu'
    })
        .toString()
        .match(regExExtractParitySemver)[0]);
}

function getLatestReleasesOfParity(releases) {
    const latestStable = getLatestFromHaystack(releases);
    return getLinuxUrlFromReleaseHtml(latestStable.body);
}

module.exports = {
    regExExtractParitySemver,
    stuckWhileSyncingCertainBlock,
    stuckWhileSyncingPeriodicSnapshot,
    getInstalledParityVersion,
    getLatestBlockTimestamp,
    getMachineCurrentTime,
    sanitizeVersion,
    timeLog,
    upgradeEthereum,
    rollbackEthereum,
    getLatestReleasesOfParity,
    getLatestBlockHeaders,
    notifyManagerInitiatedRestartToSlack,
    stuckWhileSyncingSnapshot,
    restartEthereum,
    getLastEthereumLogs,
};
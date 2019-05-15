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

module.exports = {
    stuckWhileSyncingCertainBlock,
};
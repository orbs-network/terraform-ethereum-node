const { describe, it } = require('mocha');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const { stuckWhileSyncingPeriodicSnapshot } = require('../ethereum-lib');

const basePathToFixtures = path.join(__dirname, 'fixtures');

function getLogByPath(aPath) {
    const result = fs.readFileSync(aPath);
    return result.toString().split('\n');
}

describe('ethereum health manager tests - snapshots', () => {
    it('should identify ethereum is stuck on a specific snapshot from the log lines', () => {
        const logs = getLogByPath(path.join(basePathToFixtures, 'stuck-on-periodic-snapshot.log'));

        const result = stuckWhileSyncingPeriodicSnapshot(logs);
        expect(result.ok, 'Check if the method identified the blockage in the logs').to.equal(true);
        expect(result.message).to.equal('The process is stuck while attempting to sync snapshot #6139399');
    });
});
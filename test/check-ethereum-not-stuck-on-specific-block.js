const { describe, it } = require('mocha');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');
const { stuckWhileSyncingCertainBlock } = require('../ethereum-lib');

const basePathToFixtures = path.join(__dirname, 'fixtures');

function getLogByPath(aPath) {
    const result = fs.readFileSync(aPath);
    return result.toString().split('\n');
}

describe('ethereum health manager tests', () => {
    it('should identify ethereum is stuck on a specific block from the log lines', () => {
        const logs = getLogByPath(path.join(basePathToFixtures, 'stuck-on-specific-block.log'));

        const result = stuckWhileSyncingCertainBlock(logs);
        expect(result.ok, 'Check if the method identified the blockage in the logs').to.equal(true);
        expect(result.message).to.equal('The process is stuck while attempting to sync block #7761572 0x2497…a811');
    });
});
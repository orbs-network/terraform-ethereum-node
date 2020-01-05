const { describe, it } = require('mocha');
const { expect } = require('chai');
const releases = require('./fixtures/releases');
const { getLatestReleasesOfParity, getInstalledParityVersion } = require('./../ethereum-lib');

describe('testing ethereum binary upgrade related stuff', () => {
    it('should be able to realize the latest binaries given a response from github', () => {
        const binaryPathToDownload = getLatestReleasesOfParity(releases);
        expect(binaryPathToDownload).to.eql({
            stable: 'https://releases.parity.io/ethereum/v2.5.13/x86_64-unknown-linux-gnu/parity',
            beta: 'https://releases.parity.io/ethereum/v2.6.8/x86_64-unknown-linux-gnu/parity'
        });
    });

    it('should return the current installed version of parity', () => {
        const testCommand = `echo "Parity Ethereum
        version Parity-Ethereum/v2.2.5-beta-7fbcdfeed-20181213/x86_64-macos/rustc1.31.0
      Copyright 2015-2018 Parity Technologies (UK) Ltd."`;
        expect(getInstalledParityVersion(testCommand)).to.equal('v2.2.5-beta');

        const testStableCommand = `echo "Parity Ethereum
        version Parity-Ethereum/v4.1.7-stable-7fbcdfeed-20181213/x86_64-macos/rustc1.31.0
      Copyright 2015-2018 Parity Technologies (UK) Ltd."`;
        expect(getInstalledParityVersion(testStableCommand)).to.equal('v4.1.7-stable');
    });
});
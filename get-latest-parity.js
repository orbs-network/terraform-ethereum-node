const fetch = require('node-fetch');

const {
    notifyManagerInitiatedRestartToSlack,
    getLatestReleasesOfParity,
    getInstalledParityVersion,
    regExExtractParitySemver,
    rollbackEthereum,
    timeLog,
    upgradeEthereum
} = require('./ethereum-lib');

let type = process.argv[3];
if (type !== 'beta') {
    type = 'stable';
}

let upgradeAttempted = false;

function handleRollbackForAnyReason(err) {
    if (upgradeAttempted && err.status !== 0) {
        const m = `Upgrade failed with exit code ${err.status}, Rolling back..`;
        timeLog(m);
        notifyManagerInitiatedRestartToSlack(m);
        try {
            rollbackEthereum();
        } catch (e) {
            const mRecover = `Roll back failed!\n (*go into the machine and fix this manually!*)`;
            timeLog(mRecover);
            notifyManagerInitiatedRestartToSlack(m);
        }
    }
}

process.on('uncaughtException', (err) => {
    handleRollbackForAnyReason(err);
});

process.on('SIGINT', (err) => {
    handleRollbackForAnyReason(err);
});

process.on('SIGTERM', (err) => {
    handleRollbackForAnyReason(err);
});

(async function () {
    try {
        const resp = await fetch('https://api.github.com/repos/paritytech/parity-ethereum/releases');
        const releases = await resp.json();

        const urls = getLatestReleasesOfParity(releases);
        const installUrl = urls[type];
        const version = `${installUrl.match(regExExtractParitySemver)[0]}-${type}`;
        const installedVersion = getInstalledParityVersion('./parity --version');

        if (installedVersion !== version) {
            const m = `Upgrading Parity to ${version} which is currently the latest Parity, current: ${installedVersion}`;
            timeLog(m);
            notifyManagerInitiatedRestartToSlack(m);
            upgradeAttempted = true;
            const upgradeResult = upgradeEthereum(installUrl);
            timeLog(upgradeResult.toString());
            if (upgradeResult.toString().indexOf('ERROR') !== -1) {
                throw new Error(`Couldn't update Parity ${upgradeResult.stdout.replace('\n', ' ')}`);
            }
            const mm = `Parity update to version ${version} is successful!`;
            timeLog(mm);
            notifyManagerInitiatedRestartToSlack(mm);
        }
    } catch (err) {
        handleRollbackForAnyReason(err);
        process.exit(1);
    }
})();

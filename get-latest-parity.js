const fetch = require('node-fetch');

const {
    notifyManagerInitiatedRestartToSlack,
    getLatestReleasesOfParity,
    getInstalledParityVersion,
    regExExtractParitySemver,
    sanitizeVersion,
    timeLog,
} = require('./ethereum-lib');

(async function () {
    const resp = await fetch('https://api.github.com/repos/paritytech/parity-ethereum/releases');
    const releases = await resp.json();

    const blackListResp = await fetch('https://raw.githubusercontent.com/orbs-network/orbs-ethereum-ops/master/black-list.json');
    const blacklist = await blackListResp.json();

    const versionUrl = getLatestReleasesOfParity(releases);
    const version = `${sanitizeVersion(versionUrl.match(regExExtractParitySemver)[0])}`;
    const installedVersion = getInstalledParityVersion('./parity --version');

    if (installedVersion !== version && !blacklist.versions.includes(version)) {
        const m = `Ahoi Orbs Sailors, Word is there is a new Parity version *${version}* (installed: ${installedVersion}) Please do something about this.. CC: <@UB0RYKSFP> <@UC41FJ8LX>\nTo black-list this version see: https://github.com/orbs-network/orbs-ethereum-ops/blob/master/readme.md`;
        timeLog(m);
        notifyManagerInitiatedRestartToSlack(m);
    }
})();

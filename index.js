const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { getDownloadObject } = require('./lib/utils');
// const octokit = require('./lib/octokit');
// const utils = require('./lib/utils');

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('version');
    const ghToken = core.getInput('github-token', { required: true });
    // const client = await octokit(ghToken);
    const tempDirectory = process.env['RUNNER_TEMP'] || '';

    // Download the specific version of the tool, e.g. as a tarball/zipball
    const download = getDownloadObject(version, ghToken, tempDirectory);
    console.log(download)

    // Extract the zip file onto host runner
    const pathToCLI = await tc.extractZip(download, '/usr/bin');

    console.log(pathToCLI)

  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}

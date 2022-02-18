const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const { getDownloadObject } = require('./lib/utils');

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('version');
    const ghToken = core.getInput('github-token', { required: true });

    // Download the specific version of the tool, e.g. as a tarball/zipball
    const download = getDownloadObject(version, ghToken);
    console.log(download.url)

    const pathTozip = await tc.downloadTool(download.url);
    console.log(pathTozip)

    // Extract the zip file onto host runner
    const pathToCLI = await tc.extractZip(pathTozip, '/usr/bin');

    console.log(pathToCLI)

  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}

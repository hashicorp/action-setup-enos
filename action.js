const process = require('process');
const core = require('@actions/core');
const os = require('os');

const enos = require('./enos');
const octokit = require('./octokit');

function mapArch(arch) {
  const mappings = {
    x64: 'amd64'
  };
  return mappings[arch] || arch;
}  

async function run() {
  try {
    const githubToken = core.getInput('github-token', { required: true });
    const configuredVersion = core.getInput('version');
    
    const client = await octokit(githubToken);
    const architecture = mapArch(os.arch());
    const platform = os.platform();
    const tempDirectory = process.env['RUNNER_TEMP'] || '';

    enos.ensureSupportedGoPlatform(platform, architecture);

    let version = enos.latestVersion;

    if (configuredVersion !== undefined && configuredVersion.length > 0) {
        version = configuredVersion;
    }

    const releaseAsset = await enos.getReleaseAsset(client, version, platform, architecture);
    const downloadPath = await enos.downloadReleaseAsset(client, releaseAsset, tempDirectory);

    const extractedPath = await enos.extractReleaseAsset(client, downloadPath);
    core.addPath(extractedPath);
    const installedVersion = await enos.versionNumber();

    const outputs = {
        version: installedVersion,
    };

    core.setOutput('version', outputs.version);

    return outputs;
  } catch (err) {
      core.setFailed(err.message);
      throw err;
  }
}

module.exports = run;

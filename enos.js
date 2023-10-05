/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const exec = require('@actions/exec');
const tc = require('@actions/tool-cache');

const githubRelease = require('./github-release');
const executableName = 'enos';
const gitHubRepositoryOwner = 'hashicorp';
const gitHubRepositoryRepo = 'enos';
const latestVersion = '0.0.23';

async function downloadReleaseAsset(client, releaseAsset, directory) {
  try {
    return await githubRelease.downloadAsset(client, gitHubRepositoryOwner, gitHubRepositoryRepo, releaseAsset, directory);
    } catch (err) {
      client.log.error(`Unable to download release asset: ${releaseAsset.name}: ${err}`)
      throw err
   }
}

async function extractReleaseAsset(client, downloadPath) {
  client.log.info(`Extracting release asset: ${downloadPath}`);

  try {
    return await tc.extractZip(downloadPath);
  } catch (err) {
    client.log.error(`Unable to extract release asset (${downloadPath}): ${err}`);
    throw err;
  }
}

async function getReleaseAsset(client, version, platform, architecture) {
  const release = await githubRelease.getByTag(client, gitHubRepositoryOwner, gitHubRepositoryRepo, `v${version}`);
  const assetName = `${executableName}_${version}_${platform}_${architecture}.zip`;
  const asset = release.assets.find((asset) => asset.name === assetName);

  if (asset === undefined) {
    throw new Error(`Release asset not found in release: ${assetName}`);
  }

  return asset;
}

async function version() {
  let stderr = '';
  let stdout = '';

  const execOptions = {
    listeners: {
      stderr: (data) => {
        stderr += data.toString();
      },
      stdout: (data) => {
        stdout += data.toString();
      }
    }
  };

  try {
    await exec.exec(executableName, ['version'], execOptions);
  } catch (err) {
    throw new Error(`error executing ${executableName}: ${err}`);
  }

  return {
    stderr: stderr,
    stdout: stdout
  };
}

async function versionNumber() {
  const { stderr, stdout } = await version();

  if (stderr.length > 0) {
    throw new Error(`error executing ${executableName} version: ${stderr}`);
  }

  return stdout
}

exports.downloadReleaseAsset = downloadReleaseAsset;
exports.extractReleaseAsset = extractReleaseAsset;
exports.getReleaseAsset = getReleaseAsset;
exports.latestVersion = latestVersion;
exports.version = version;
exports.versionNumber = versionNumber;

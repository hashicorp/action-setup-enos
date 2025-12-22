/**
 * Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: MPL-2.0
 */

import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

import * as githubRelease from "./github-release.js";

const executableName = "enos";
const gitHubRepositoryOwner = "hashicorp";
const gitHubRepositoryRepo = "enos";

export const latestVersion = "0.0.35";

export async function downloadReleaseAsset(client, releaseAsset, directory) {
  try {
    return await githubRelease.downloadAsset(
      client,
      gitHubRepositoryOwner,
      gitHubRepositoryRepo,
      releaseAsset,
      directory,
    );
  } catch (err) {
    core.error(
      `Unable to download release asset: ${releaseAsset.name}: ${err}`,
    );
    throw err;
  }
}

export async function extractReleaseAsset(client, downloadPath) {
  core.info(`Extracting release asset: ${downloadPath}`);

  try {
    return await tc.extractZip(downloadPath);
  } catch (err) {
    core.error(`Unable to extract release asset (${downloadPath}): ${err}`);
    throw err;
  }
}

export async function getReleaseAsset(client, version, platform, architecture) {
  const release = await githubRelease.getByTag(
    client,
    gitHubRepositoryOwner,
    gitHubRepositoryRepo,
    `v${version}`,
  );
  const assetName = `${executableName}_${version}_${platform}_${architecture}.zip`;
  const asset = release.assets.find(
    (this_asset) => this_asset.name === assetName,
  );

  if (asset === undefined) {
    throw new Error(`Release asset not found in release: ${assetName}`);
  }

  return asset;
}

export async function versionCmdOutput() {
  let stderr = "";
  let stdout = "";

  const execOptions = {
    listeners: {
      stderr: (data) => {
        stderr += data.toString();
      },
      stdout: (data) => {
        stdout += data.toString();
      },
    },
  };

  try {
    await exec.exec(executableName, ["version"], execOptions);
  } catch (err) {
    throw new Error(`error executing ${executableName}: ${err}`);
  }

  return {
    stderr,
    stdout,
  };
}

export async function versionNumber() {
  const { stderr, stdout } = await versionCmdOutput();

  if (stderr.length > 0) {
    throw new Error(`error executing ${executableName} version: ${stderr}`);
  }

  return stdout;
}

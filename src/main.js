/**
 * Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: MPL-2.0
 */

import process from "process";
import os from "os";

import * as core from "@actions/core";

import * as octokit from "./octokit.js";
import * as enos from "./enos.js";

function mapArch(arch) {
  const mappings = {
    x64: "amd64",
  };
  return mappings[arch] || arch;
}

export async function main() {
  try {
    let version = enos.latestVersion;
    const configuredVersion = core.getInput("version");
    if (configuredVersion !== undefined && configuredVersion.length > 0) {
      version = configuredVersion;
    }

    let token = process.env["GITHUB_TOKEN"];
    const configuredToken = core.getInput("github-token");
    if (configuredToken !== undefined && configuredToken.length > 0) {
      token = configuredToken;
    }

    const client = await octokit.client(version, token);

    const architecture = mapArch(os.arch());
    const platform = os.platform();
    const tempDirectory = process.env["RUNNER_TEMP"] || "";
    core.debug(`
Finding download URL for enos (${version}/${platform}/${architecture})
`);
    const releaseAsset = await enos.getReleaseAsset(
      client,
      version,
      platform,
      architecture,
    );

    core.debug(`
Attempting to download release asset ${releaseAsset.name} to ${tempDirectory}
`);
    const downloadPath = await enos.downloadReleaseAsset(
      client,
      releaseAsset,
      tempDirectory,
    );

    core.debug(`
Attempting to extract asset
`);
    const extractedPath = await enos.extractReleaseAsset(client, downloadPath);
    core.debug(`
Adding ${extractedPath} to path on runner
`);
    core.addPath(extractedPath);
    const installedVersion = await enos.versionNumber();

    const outputs = {
      version: installedVersion,
    };

    core.debug(`
Found enos version ${outputs.version} in path
`);
    core.setOutput("version", outputs.version);

    return outputs;
  } catch (err) {
    core.setFailed(err.message);
    console.error(err);
  }
}

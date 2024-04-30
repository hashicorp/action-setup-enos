/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const fs = require("fs");
const path = require("path");
const got = require("got");

const core = require("@actions/core");

async function downloadAsset(client, owner, repo, releaseAsset, directory) {
  core.info(`Downloading release asset: ${releaseAsset.name}`);

  try {
    const downloadPath = path.resolve(directory, releaseAsset.name);
    if (typeof releaseAsset.url === "undefined") {
      // template url for tests
      releaseAsset.url = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${releaseAsset.id}`;
    }

    const headers = {
      Accept: "application/octet-stream",
    };
    const auth = await client.auth();
    if (auth.type === "token") {
      core.debug("Using token auth for download");
      headers.Authorization = `Bearer ${auth.token}`;
    }

    const response = await got(releaseAsset.url, {
      method: "GET",
      headers,
    });

    if (response.statusCode === 404) {
      throw new Error("Not Found");
    }

    core.debug(
      `Release asset ${releaseAsset.name} size: ${response.rawBody.length}`,
    );
    if (response.rawBody.length === 0) {
      throw new Error("Empty Asset");
    }

    await fs.promises.writeFile(downloadPath, Buffer.from(response.rawBody));

    return downloadPath;
  } catch (err) {
    core.error(
      `Unable to download release asset (${releaseAsset.name}): ${err}`,
    );
    throw err;
  }
}

async function getByTag(client, owner, repo, tag) {
  core.info(`Getting release for tag: ${tag}`);

  try {
    core.debug(`Searching for release by tag: ${owner}/${repo}/${tag}`);
    const release = await client.request(
      "GET /repos/{owner}/{repo}/releases/tags/{tag}",
      {
        owner,
        repo,
        tag,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    core.debug(`Found release: ${JSON.stringify(release)}`);

    return release.data;
  } catch (err) {
    core.error(`Unable to get release for tag (${tag}): ${err}`);
    throw err;
  }
}

module.exports = {
  downloadAsset,
  getByTag,
};

const fs = require('fs');
const path = require('path');
const core = require('@actions/core');
const got = require('got');
// const stream = require('stream');
// const util = require('util');

// const pipeline = util.promisify(stream.pipeline);

async function downloadAsset(client, owner, repo, releaseAsset, directory) {
    client.log.info(`Downloading release asset: ${releaseAsset.name}`);

    try {
        const downloadPath = path.resolve(directory, releaseAsset.name);
        const file = fs.createWriteStream(downloadPath);
        // const response = await client.rest.repos.getReleaseAsset({
        //     // headers: {
        //     //     Accept: 'application/octet-stream',
        //     // },
        //     owner: owner,
        //     repo: repo,
        //     asset_id: releaseAsset.id,
        // });

        // client.log.info(`full client ${JSON.stringify(response)}`);
        
        // Workaround since oktokit asset downloads are broken https://github.com/octokit/core.js/issues/415
        const githubToken = core.getInput('github-token');

        if (typeof releaseAsset.url === "undefined") { // template url for tests
            releaseAsset.url = `https://api.github.com/repos/${owner}/${repo}/releases/assets/${releaseAsset.id}`;
        }
        
        const response = await got(releaseAsset.url, {
                method: 'GET',
                headers: {
                    authorization: `token ${githubToken}`,
                    accept: 'application/octet-stream',
                },
            });

        if (response.statusCode === 404) {
            throw 'Not Found'
        }

        file.write(Buffer.from(response.rawBody));
        file.end();

        return downloadPath;
    } catch (err) {
        client.log.error(`Unable to download release asset (${releaseAsset.name}): ${err}`);
        throw err;
    }
}

async function getByTag(client, owner, repo, tag) {
    client.log.info(`Getting release for tag: ${tag}`);

    try {
        const release = await client.rest.repos.getReleaseByTag({
            owner: owner,
            repo: repo,
            tag: tag
        });

        client.log.debug(`Found release: ${JSON.stringify(release)}`);

        return release.data;
    } catch (err) {
        client.log.error(`Unable to get release for tag (${tag}): ${err}`);
        throw err;
    }
}

exports.downloadAsset = downloadAsset;
exports.getByTag = getByTag;

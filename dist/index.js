/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 834:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const process = __nccwpck_require__(282);
const core = __nccwpck_require__(450);
const os = __nccwpck_require__(37);

const enos = __nccwpck_require__(974);
const octokit = __nccwpck_require__(884);

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


/***/ }),

/***/ 974:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const exec = __nccwpck_require__(609);
const tc = __nccwpck_require__(454);

const githubRelease = __nccwpck_require__(737);
const executableName = 'bob';
const gitHubRepositoryOwner = 'hashicorp';
const gitHubRepositoryRepo = 'bob';
const latestVersion = '0.0.19';

async function downloadReleaseAsset(client, releaseAsset, directory) {
  return await githubRelease.downloadAsset(client, gitHubRepositoryOwner, gitHubRepositoryRepo, releaseAsset, directory);
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

  // Expected output: bob v#.#.# ()
  if (stdout.length === 0 || stdout.split(' ').length !== 3) {
    throw new Error(`unexpected ${executableName} version output: ${stdout}`);
  }

  return stdout.split(' ')[1].substring(1)
}

exports.downloadReleaseAsset = downloadReleaseAsset;
exports.extractReleaseAsset = extractReleaseAsset;
exports.getReleaseAsset = getReleaseAsset;
exports.latestVersion = latestVersion;
exports.version = version;
exports.versionNumber = versionNumber;


/***/ }),

/***/ 737:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);
const core = __nccwpck_require__(450);
const got = __nccwpck_require__(213);
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


/***/ }),

/***/ 884:
/***/ ((module) => {

module.exports = eval("require")("./octokit");


/***/ }),

/***/ 450:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 609:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 454:
/***/ ((module) => {

module.exports = eval("require")("@actions/tool-cache");


/***/ }),

/***/ 213:
/***/ ((module) => {

module.exports = eval("require")("got");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 282:
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(834);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
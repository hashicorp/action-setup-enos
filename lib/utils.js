const os = require('os');
const fs = require('fs');
const path = require('path');
// const core = require('@actions/core');
const got = require('got');

function getDownloadObject(version, ghToken, tempDirectory) {
  // arch in [arm, arm64, x64...] (https://nodejs.org/api/os.html#os_os_arch)
  // return value in [amd64, arm64]
  function mapArch(arch) {
    const mappings = {
      x64: 'amd64'
    };
    return mappings[arch] || arch;
  }  

  // https://nodejs.org/api/os.html#os_os_platform
  // return value in ['aix', 'darwin', 'freebsd','linux', 'openbsd', 'sunos', and 'win32']
  const platform = os.platform();

  const filename = `bob_${ version }_${platform}_${ mapArch(os.arch()) }`;
  const downloadPath = path.resolve(tempDirectory, filename);
  const file = fs.createWriteStream(downloadPath);
  // const url = `https://x-access-token:${ghToken}@github.com/hashicorp/bob/releases/download/v${ version }/${ filename }.zip`;
  const url = `https://github.com/hashicorp/bob/releases/download/v${ version }/${ filename }.zip`;
  
  console.log(url)

  const response = got(url, {
    method: 'GET',
    headers: {
        authorization: `token ${ghToken}`,
        accept: 'application/octet-stream',
    },
  });

  if (response.statusCode === 404) {
  throw 'Not Found'
  }

  file.write(Buffer.from(response.rawBody));
  file.end();

  return downloadPath;
}
//   return {
//     url
//   };
// }

// async function extractReleaseAsset(client, download) {
//   client.log.info(`Extracting release asset: ${download}`);

//   try {
//     return await tc.extractZip(download);
//   } catch (err) {
//     client.log.error(`Unable to extract release asset (${download}): ${err}`);
//     throw err;
//   }
// }

module.exports = { getDownloadObject }

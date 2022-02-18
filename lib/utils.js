const os = require('os');

function getDownloadObject(version) {
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
  const url = `https://github.com/hashicorp/bob/releases/download/v${ version }/${ filename }.zip`;
  
  console.log(url)

  return {
    url
  };
}

module.exports = { getDownloadObject }

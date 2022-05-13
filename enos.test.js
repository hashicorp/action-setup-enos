const fs = require('fs');
const nock = require('nock');
const os = require('os');
const path = require('path');

const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const { Octokit } = require("@octokit/rest");

const enos = require('./enos');

const client = new Octokit({
  auth: 'testtoken',
  log: console,
});

beforeAll(() => {
  nock.disableNetConnect();
});

describe('download release asset', () => {
  test('downloads successfully', async () => {
    const releaseAsset = {
      id: 1,
      name: "enos_0.0.2_linux_amd64.zip",
    };

    fs.mkdtemp(path.join(os.tmpdir(), 'setup-enos-'), async (err, directory) => {
      if (err) throw err;

      const expectedPath = path.resolve(directory, releaseAsset.name);

      nock('https://api.github.com')
        .get('/repos/hashicorp/enos/releases/assets/1')
        .replyWithFile(200, path.resolve(__dirname, 'test.zip'), { 'content-type': 'application/octet-stream' });

      const downloadPath = await enos.downloadReleaseAsset(client, releaseAsset, directory);

      await expect(downloadPath).toEqual(expectedPath);

      fs.readFile(downloadPath, null, async (err, data) => {
        if (err) throw err;

        await expect(data).toEqual(fs.readFileSync(path.resolve(__dirname, 'test.zip')));
      });
    });
  });

  test('throws error', async () => {
    const releaseAsset = {
      id: 1,
      name: "enos_0.0.2_linux_amd64.zip",
    };
    fs.mkdtemp(path.join(os.tmpdir(), 'setup-enos-'), async (err, directory) => {
      if (err) throw err;

      nock('https://api.github.com')
        .get(`/repos/hashicorp/enos/releases/assets/1`)
        .reply(404, 'Not Found');

      const enos = require('./enos')

      await expect(enos.downloadReleaseAsset(client, releaseAsset, directory)).rejects.toThrow('Not Found');
    });
  });
});

describe('extract release asset', () => {
  test('successful', async () => {
    const spy = jest.spyOn(tc, 'extractZip');
    spy.mockReturnValue('/tmp/test');

    const result = await enos.extractReleaseAsset(client, '/tmp/test/test_v1.0.0_linux_amd64.zip');

    await expect(spy).toHaveBeenCalled();
    await expect(result).toEqual('/tmp/test');
  });

  test('throws error', async () => {
    const spy = jest.spyOn(tc, 'extractZip');
    spy.mockRejectedValue(new Error('executable not found: zip'))

    await expect(enos.extractReleaseAsset(client, '/tmp/test/test_v1.0.0_linux_amd64.zip')).rejects.toThrow('executable not found');
    await expect(spy).toHaveBeenCalled();
  });
});

describe('get release asset', () => {
  test.each([
    ['darwin', 'amd64'],
    ['linux', 'amd64'],
  ])('%s/%s', async (goOperatingSystem, goArchitecture) => {
    const mockRelease = {
      assets: [
        {
          id: 1,
          name: "enos_0.0.2_darwin_amd64.zip"
        },
        {
          id: 2,
          name: "enos_0.0.2_linux_amd64.zip"
        },
      ],
      id: "1",
      name: "v0.0.2",
    };

    nock('https://api.github.com')
      .get(`/repos/hashicorp/enos/releases/tags/v0.0.2`)
      .reply(200, mockRelease);

    const releaseAsset = await enos.getReleaseAsset(client, '0.0.2', goOperatingSystem, goArchitecture);

    await expect(releaseAsset).toEqual(mockRelease.assets.find((asset) => asset.name.includes(goOperatingSystem) && asset.name.includes(goArchitecture)));
  })

  test('throws release asset not found error', async () => {
    const mockRelease = {
      assets: [
        {
          id: 1,
          name: "enos_0.0.2_darwin_amd64.zip"
        },
        {
          id: 2,
          name: "enos_0.0.2_linux_amd64.zip"
        },
      ],
      id: "1",
      name: "v0.0.2",
    };

    nock('https://api.github.com')
      .get(`/repos/hashicorp/enos/releases/tags/v0.0.2`)
      .reply(200, mockRelease);

    await expect(enos.getReleaseAsset(client, '0.0.2', 'darwin', '386')).rejects.toThrow('Release asset not found in release');
  });

  test('throws release not found error', async () => {
    nock('https://api.github.com')
      .get(`/repos/hashicorp/enos/releases/tags/v0.0.2`)
      .reply(404, 'Not Found');

    await expect(enos.getReleaseAsset(client, '0.0.2', 'linux', 'amd64')).rejects.toThrow('Not Found');
  });
});

describe('version', () => {
  test('stdout', async () => {
    const spy = jest.spyOn(exec, 'exec');
    spy.mockImplementation((commandLine, args, options) => {
      options.listeners.stdout('enos v0.0.2 ()');
      Promise.resolve();
    });

    const result = await enos.version();

    await expect(spy).toHaveBeenCalled();
    await expect(result).toEqual({ stderr: '', stdout: 'enos v0.0.2 ()' });
  });

  test('stderr', async () => {
    const spy = jest.spyOn(exec, 'exec');
    spy.mockImplementation((commandLine, args, options) => {
      options.listeners.stderr('executable not found: enos');
      Promise.resolve();
    });

    const result = await enos.version();

    await expect(spy).toHaveBeenCalled();
    await expect(result).toEqual({ stderr: 'executable not found: enos', stdout: '' });
  });

  test('throws exec error', async () => {
    const spy = jest.spyOn(exec, 'exec');
    spy.mockImplementation(() => Promise.resolve());
    spy.mockRejectedValue(new Error('child process missing stdin'))

    await expect(enos.version()).rejects.toThrow('error executing');
    await expect(spy).toHaveBeenCalled();
  });
});

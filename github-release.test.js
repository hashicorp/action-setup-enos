const fs = require('fs');
const nock = require('nock');
const os = require('os');
const path = require('path');
const { Octokit } = require("@octokit/rest");

const githubRelease = require('./github-release');

const client = new Octokit({
    auth: 'testtoken',
    log: console,
});

beforeAll(() => {
    nock.disableNetConnect();
});

describe('download asset', () => {
    test('downloads successfully', async () => {
        const releaseAsset = {
            id: 1,
            name: "test_v1.0.0_linux_amd64.zip",
        };

        fs.mkdtemp(path.join(os.tmpdir(), 'setup-hc-releases-'), async (err, directory) => {
            if (err) throw err;

            const expectedPath = path.resolve(directory, releaseAsset.name);

            nock('https://api.github.com')
                .get(`/repos/testowner/testrepo/releases/assets/1`)
                .replyWithFile(200, path.resolve(__dirname, 'test.zip'), { 'content-type': 'application/octet-stream' });

            const downloadPath = await githubRelease.downloadAsset(client, 'testowner', 'testrepo', releaseAsset, directory);

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
            name: "test_v1.0.0_linux_amd64.zip",
        };
        fs.mkdtemp(path.join(os.tmpdir(), 'setup-hc-releases-'), async (err, directory) => {
            if (err) throw err;

            nock('https://api.github.com')
                .get(`/repos/testowner/testrepo/releases/assets/1`)
                .reply(404, 'Not Found');

            const githubRelease = require('./github-release')

            await expect(githubRelease.downloadAsset(client, 'testowner', 'testrepo', releaseAsset, directory)).rejects.toThrow('Not Found');
        });
    });
});

describe('get by tag', () => {
    test('gets successfully', async () => {
        const mockRelease = {
            name: "v1.0.0",
        };

        nock('https://api.github.com')
            .get(`/repos/testowner/testrepo/releases/tags/v1.0.0`)
            .reply(200, mockRelease);

        const release = await githubRelease.getByTag(client, 'testowner', 'testrepo', 'v1.0.0');

        await expect(release).toEqual(mockRelease);
    });

    test('throws error', async () => {
        nock('https://api.github.com')
            .get(`/repos/testowner/testrepo/releases/tags/v1.0.0`)
            .reply(404, 'Not Found');

        const githubRelease = require('./github-release')

        await expect(githubRelease.getByTag(client, 'testowner', 'testrepo', 'v1.0.0')).rejects.toThrow('Not Found');
    });
});

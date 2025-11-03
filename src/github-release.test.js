/**
 * Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: MPL-2.0
 */

import nock from "nock";
import fs from "fs";
import os from "os";
import path from "path";
import { Octokit } from "@octokit/rest";
import { getByTag, downloadAsset } from "../src/github-release";
import { beforeEach, describe, expect, test } from "vitest";

const client = new Octokit({
  log: console,
});

beforeEach(() => {
  nock.disableNetConnect();
});

describe("download asset", () => {
  test("downloads successfully", async () => {
    const releaseAsset = {
      id: 1,
      name: "test_v1.0.0_linux_amd64.zip",
    };

    fs.mkdtemp(
      path.join(os.tmpdir(), "setup-hc-releases-"),
      async (err, directory) => {
        if (err) throw err;

        const expectedPath = path.resolve(directory, releaseAsset.name);

        nock("https://api.github.com")
          .get(`/repos/testowner/testrepo/releases/assets/1`)
          .replyWithFile(
            200,
            path.resolve(__dirname, "../", "__tests__", "test.zip"),
            {
              "content-type": "application/octet-stream",
            },
          );

        const downloadPath = await downloadAsset(
          client,
          "testowner",
          "testrepo",
          releaseAsset,
          directory,
        );

        expect(downloadPath).toEqual(expectedPath);

        fs.readFile(downloadPath, null, async (readErr, data) => {
          if (readErr) throw readErr;

          expect(data).toEqual(
            fs.readFileSync(
              path.resolve(__dirname, "../", "__tests__", "test.zip"),
            ),
          );
        });
      },
    );
  });

  test("throws error", async () => {
    const releaseAsset = {
      id: 1,
      name: "test_v1.0.0_linux_amd64.zip",
    };
    fs.mkdtemp(
      path.join(os.tmpdir(), "setup-hc-releases-"),
      async (err, directory) => {
        if (err) throw err;

        nock("https://api.github.com")
          .get(`/repos/testowner/testrepo/releases/assets/1`)
          .reply(404, "Not Found");

        await expect(
          downloadAsset(
            client,
            "testowner",
            "testrepo",
            releaseAsset,
            directory,
          ),
        ).rejects.toThrow("Not Found");
      },
    );
  });
});

describe("get by tag", () => {
  test("gets successfully", async () => {
    const mockRelease = {
      name: "v1.0.0",
    };

    nock("https://api.github.com")
      .get(`/repos/testowner/testrepo/releases/tags/v1.0.0`)
      .reply(200, mockRelease);

    const release = await getByTag(client, "testowner", "testrepo", "v1.0.0");

    expect(release).toEqual(mockRelease);
  });

  test("throws error", async () => {
    nock("https://api.github.com")
      .get(`/repos/testowner/testrepo/releases/tags/v1.0.0`)
      .reply(404, "Not Found");

    await expect(
      getByTag(client, "testowner", "testrepo", "v1.0.0"),
    ).rejects.toThrow("Not Found");
  });
});

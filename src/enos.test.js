/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import nock from "nock";
import fs from "fs";
import os from "os";
import path from "path";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import { Octokit } from "@octokit/rest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import * as enos from "./enos";

const client = new Octokit({
  log: console,
});

beforeEach(() => {
  nock.disableNetConnect();
});

describe("download release asset", () => {
  test("downloads successfully", async () => {
    const releaseAsset = {
      id: 1,
      name: "enos_0.0.2_linux_amd64.zip",
    };

    fs.mkdtemp(
      path.join(os.tmpdir(), "setup-enos-"),
      async (err, directory) => {
        if (err) throw err;

        const expectedPath = path.resolve(directory, releaseAsset.name);
        const assetPath = path.resolve(
          __dirname,
          "../",
          "__tests__",
          "test.zip",
        );

        nock("https://api.github.com")
          .get("/repos/hashicorp/enos/releases/assets/1")
          .replyWithFile(200, assetPath, {
            "content-type": "application/octet-stream",
          });

        const downloadPath = await enos.downloadReleaseAsset(
          client,
          releaseAsset,
          directory,
        );

        expect(downloadPath).toEqual(expectedPath);

        fs.readFile(downloadPath, null, async (readErr, data) => {
          if (readErr) throw readErr;

          expect(data).toEqual(fs.readFileSync(assetPath));
        });
      },
    );
  });

  test("throws error", async () => {
    const releaseAsset = {
      id: 1,
      name: "enos_0.0.2_linux_amd64.zip",
    };
    fs.mkdtemp(
      path.join(os.tmpdir(), "setup-enos-"),
      async (err, directory) => {
        if (err) throw err;

        nock("https://api.github.com")
          .get(`/repos/hashicorp/enos/releases/assets/1`)
          .reply(404, "Not Found");

        const result = enos.downloadReleaseAsset(
          client,
          releaseAsset,
          directory,
        );
        await expect(result).rejects.toThrow("Not Found");
      },
    );
  });
});

describe("extract release asset", () => {
  test("successful", async () => {
    const spy = vi.spyOn(tc, "extractZip");
    spy.mockImplementation(() => "/tmp/test");

    const result = await enos.extractReleaseAsset(
      client,
      "/tmp/test/test_v1.0.0_linux_amd64.zip",
    );

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual("/tmp/test");
  });

  test("throws error", async () => {
    const spy = vi.spyOn(tc, "extractZip");
    spy.mockRejectedValue(new Error("executable not found: zip"));

    await expect(
      enos.extractReleaseAsset(client, "/tmp/test/test_v1.0.0_linux_amd64.zip"),
    ).rejects.toThrow("executable not found");
    expect(spy).toHaveBeenCalled();
  });
});

describe("get release asset", () => {
  test.each([
    ["darwin", "amd64"],
    ["linux", "amd64"],
  ])("%s/%s", async (goOperatingSystem, goArchitecture) => {
    const mockRelease = {
      assets: [
        {
          id: 1,
          name: "enos_0.0.2_darwin_amd64.zip",
        },
        {
          id: 2,
          name: "enos_0.0.2_linux_amd64.zip",
        },
      ],
      id: "1",
      name: "v0.0.2",
    };

    nock("https://api.github.com")
      .get(`/repos/hashicorp/enos/releases/tags/v0.0.2`)
      .reply(200, mockRelease);

    const releaseAsset = await enos.getReleaseAsset(
      client,
      "0.0.2",
      goOperatingSystem,
      goArchitecture,
    );

    expect(releaseAsset).toEqual(
      mockRelease.assets.find(
        (asset) =>
          asset.name.includes(goOperatingSystem) &&
          asset.name.includes(goArchitecture),
      ),
    );
  });

  test("throws release asset not found error", async () => {
    const mockRelease = {
      assets: [
        {
          id: 1,
          name: "enos_0.0.2_darwin_amd64.zip",
        },
        {
          id: 2,
          name: "enos_0.0.2_linux_amd64.zip",
        },
      ],
      id: "1",
      name: "v0.0.2",
    };

    nock("https://api.github.com")
      .get(`/repos/hashicorp/enos/releases/tags/v0.0.2`)
      .reply(200, mockRelease);

    await expect(
      enos.getReleaseAsset(client, "0.0.2", "darwin", "386"),
    ).rejects.toThrow("Release asset not found in release");
  });

  test("throws release not found error", async () => {
    nock("https://api.github.com")
      .get(`/repos/hashicorp/enos/releases/tags/v0.0.2`)
      .reply(404, "Not Found");

    await expect(
      enos.getReleaseAsset(client, "0.0.2", "linux", "amd64"),
    ).rejects.toThrow("Not Found");
  });
});

describe("version", () => {
  test("stdout", async () => {
    const spy = vi.spyOn(exec, "exec");
    spy.mockImplementation((_commandLine, _args, options) => {
      options.listeners.stdout("enos v0.0.2 ()");
      Promise.resolve();
    });

    const result = await enos.versionCmdOutput();

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual({ stderr: "", stdout: "enos v0.0.2 ()" });
  });

  test("stderr", async () => {
    const spy = vi.spyOn(exec, "exec");
    spy.mockImplementation((_commandLine, _args, options) => {
      options.listeners.stderr("executable not found: enos");
      Promise.resolve();
    });

    const result = await enos.versionCmdOutput();

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual({
      stderr: "executable not found: enos",
      stdout: "",
    });
  });

  test("throws exec error", async () => {
    const spy = vi.spyOn(exec, "exec");
    spy.mockImplementation(() => Promise.resolve());
    spy.mockRejectedValue(new Error("child process missing stdin"));

    await expect(enos.versionCmdOutput()).rejects.toThrow("error executing");
    expect(spy).toHaveBeenCalled();
  });
});

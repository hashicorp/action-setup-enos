# action-setup-enos
This is a GitHub Action to setup the [`enos`](https://github.com/hashicorp/enos) CLI. This action installs and exposes a specified version of the `enos` CLI in the Github Actions runner environment for use in Github workflows. It can be run on `ubuntu-latest` and `macos-latest` runners.

The structure and tests are adopted from [`setup-hc-releases`](https://github.com/hashicorp/setup-hc-releases).

## Usage

Set up the `enos` CLI with the version to be installed:

```yaml
steps:
 - name: Setup Enos
   uses: hashicorp/action-setup-enos@v1
   with:
     github-token:
       ${{ secrets.GITHUB_TOKEN }}
     version:
       0.0.1
- name: Check Enos version
  run: enos version
```

## Inputs
The action supports the following inputs:

- `github-token`: The GitHub token secret with sufficient permissions to download `enos` CLI
- `version`: The version of `enos` to install, defaulting to `0.0.1`

## Update
To update the action, run `npm run all` to compile and load the npm modules with the latest code updates.

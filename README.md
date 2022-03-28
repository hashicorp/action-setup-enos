# action-setup-enos
GitHub action to setup `enos` CLI. This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `enos` CLI on the runner environment.

The structure and tests are adopted from `setup-hc-releases`.

## Usage

Setup the `enos` CLI:

```yaml
steps:
- uses: hashicorp/action-setup-enos@v1
  with:
    github-token:
      ${{ secrets.GITHUB_TOKEN }}
```

A specific version of the `enos` CLI can be installed:

```yaml
steps:
- uses: hashicorp/action-setup-enos
  with:
    version:
      0.0.1
```

## Inputs
The actions supports the following inputs:

- `github-token`: The GitHub token secret to use with permissions to download `enos` CLI
- `version`: The version of `enos` to install, defaulting to `0.0.1`
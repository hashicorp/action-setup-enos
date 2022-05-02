# action-setup-enos
GitHub action to setup `enos` CLI. This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `enos` CLI on the runner environment.

The structure and tests are adopted from `setup-hc-releases`.

## Usage

Setup the `enos` CLI with specific version of the `enos` CLI can be installed::

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
The actions supports the following inputs:

- `github-token`: The GitHub token secret to use with permissions to download `enos` CLI
- `version`: The version of `enos` to install, defaulting to `0.0.1`

# Update Enos Action
To update the Enos Action run `npm run all` to compile and load the npm modules with the latest code updates.

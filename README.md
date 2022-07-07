# action-setup-enos
GitHub action to setup `enos` CLI. This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `enos` CLI on the runner environment.

The structure and tests are adopted from `setup-hc-releases`.

## Pre-requisite
Enos CLI requires the `terraform` binary to be in the default `PATH`. Install the Terraform CLI using `setup-terraform` GitHub
action. Also set `terraform-wrapper` to `false` as the Terraform wrapper will break Terraform execution in Enos because it changes the output to text when we expect it to be JSON.

### setup-terraform GitHub Action

```yaml
steps:
 - name: Setup Terraform
   uses: hashicorp/setup-terraform@v1
   with:
     # the terraform wrapper will break terraform execution in enos because
     # it changes the output to text when we expect it to be JSON.
     terraform_wrapper: false
     cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
```

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
       0.0.9
- name: Check Enos version
  run: enos version
```

## Inputs
The actions supports the following inputs:

- `github-token`: The GitHub token secret to use with permissions to download `enos` CLI
- `version`: The version of `enos` to install, defaulting to `0.0.9`

# Update Enos Action
To update the Enos Action run `npm run all` to compile and load the npm modules with the latest code updates.

# Release Process
To release the updated version of Enos Action run the following steps:
1. Replace the `Enos` version in following files:
    -  README.md
    -  action.yml
    -  enos.js
    -  package.json
1. Run `npm run all`
1. Create a PR with updated files above and the generated `dist/index.js`
1. Get reviewed and the PR merged
1. (Automated with `tagrelease` GitHub Actions Workflow) Add github tags to `main` branch and force update `v1` tag by running the following commands
   - `git tag -a -m "v1.5" v1.5`
   - `git tag -a -m "v1.5" v1 -f`
   - `git push --tags -f`


# action-setup-enos
`action-setup-enos` is a GitHub action that installs and exposes a specified version of the `enos` CLI in a Github runner environment. This action can be run on `ubuntu-latest` and `macos-latest` runners.

The structure and tests are adopted from `setup-hc-releases`.

## Prerequisites

### Obtain necessary permissions

In order to use the `action-setup-enos` action and download the `enos` CLI, your repo needs to have a Github secret containing a token with `repo` scope. If your repo is already integrated with CRT, your `ELEVATED_GITHUB_TOKEN` should be sufficient for this. The only additional step is to ensure that your service account user associated with this token has read access to both the `action-setup-enos` [repo](https://github.com/hashicorp/action-setup-enos) and the `enos` [repo](https://github.com/hashicorp/enos). Reach out to the team on Slack in #team-quality to get your user added to both repos.

**Note:** This token must also be "authorized" to the HashiCorp org via SSO. To do this, you would need to log in to Github as the service account user associated with the token, and follow [these instructions](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).

### `setup-terraform` GitHub Action

The `enos` CLI requires the `terraform` binary to be in the default `PATH`. Install the Terraform CLI using `setup-terraform` GitHub
action. Also set `terraform-wrapper` to `false` as the Terraform wrapper will break Terraform execution in Enos because it changes the output to text when we expect it to be JSON.

Example configuration:

```yaml
steps:
 - name: Setup Terraform
   uses: hashicorp/setup-terraform@v1
   with:
     # The terraform wrapper will break terraform execution in Enos because
     # it changes the output to text when we expect it to be JSON.
     terraform_wrapper: false
     cli_config_credentials_token: ${{ secrets.TF_API_TOKEN }}
```

## Usage

```yaml
steps:
 - name: Setup Enos
   uses: hashicorp/action-setup-enos@v1
   with:
     github-token:
       ${{ secrets.GITHUB_TOKEN }}
     version:
       0.0.14
- name: Check Enos version
  run: enos version
```

## Inputs
The actions supports the following inputs:

- `github-token`: The GitHub secret to use for access to Enos repos, with the permissions described above
- `version`: The version of `enos` to install, defaulting to `0.0.14`

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

# action-setup-enos

`action-setup-enos` downloads and exposes the [enos CLI](https://github.com/hashicorp/enos) into
the runner environment.

The `enos` CLI requires the `terraform` binary to be in the default `PATH`. You can install Terraform
using the [setup-terraform](https://github.com/hashicorp/setup-terraform).

_NOTE_ Use `setup-terraform@v3` or later, otherwise you'll need to set `terraform-wrapper: false` as
the wrapper in prior versions will break Terraform execution in Enos.

## Usage

```yaml
steps:
 - name: Setup Terraform
   uses: hashicorp/setup-terraform@v3
 - name: Setup Enos
   uses: hashicorp/action-setup-enos@v1
     version:
       0.0.28
```

## Inputs

The actions supports the following inputs:

- `version`: The version of `enos` to install, defaulting to `0.0.28`

# Update Enos Action

To update the Enos Action run `npm run all` to compile and load the npm modules with the latest code updates.

# Release Process

To release the updated version of Enos Action run the following steps:

1. Update the `Enos` version to the [latest release](https://github.com/hashicorp/enos/releases) in following files:
   - README.md
   - enos.js
2. Update the `action-setup-enos` version in
   - package.json
3. Run `npm install && npm run all`
4. Create a PR with updated files above and the generated `dist/index.js`
5. Get review and the PR merged
6. (Automated with `tagrelease` GitHub Actions Workflow) Add github tags to `main` branch and force update `v1` tag by running the following commands
   - `TAG="v$(cat package.json| jq -r '.version')"`
   - `git tag -a -m "$TAG" $TAG`
   - `git tag -a -m "$TAG" v1 -f`
   - `git push --tags -f`

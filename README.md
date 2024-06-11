# action-setup-enos

`action-setup-enos` downloads and installs the [enos CLI](https://github.com/hashicorp/enos) into
the runner environment.

Many `enos` CLI sub-commands require the `terraform` binary to be in the default `PATH`. You can
install Terraform on the runner using the [setup-terraform](https://github.com/hashicorp/setup-terraform).

> [!IMPORTANT]
> Use `setup-terraform@v3` or later, otherwise you'll need to set `terraform-wrapper: false` as
> the wrapper in prior versions will break the `enos` CLI's ability to execute `terraform` correctly.

## Usage

```yaml
steps:
  - name: Set up Terraform
    uses: hashicorp/setup-terraform@v3
  - name: Set up Enos
    uses: hashicorp/action-setup-enos@v1
    with:
      version: 0.0.31 # You only need to specify a version if you wish to override the default version
```

## Inputs

The actions supports the following inputs:

- `version`: The version of `enos` to install, defaulting to `0.0.31`

## Release a new version of Enos

- [ ] Ensure that you have the latest version of Node 20 (Iron) installed
- [ ] Ensure that you have installed the [copywrite](https://github.com/hashicorp/copywrite) utility
      for writing copywrite headers.
- [ ] Bump the version in `package.json`. **This is the action version, not the enos cli version, it wont likely match the enos version**
- [ ] If we're releasing a new version of `enos`:
  - [ ] Change the `latestVersion` in `src/enos.js` to reflect the new version.
  - [ ] Update references to specific version in the `README.md` to the new version.
- [ ] Run `npm i && npm run all` to compile, format, add license headers, lint, and test the action.
- [ ] If all of the npm scripts pass then create a PR with the modified files.
- [ ] Get review and the PR merged

After the pull request is merged it will automatically be released with the `tagrelease` Github Actions workflow.

> [!NOTE]
> If for some reason you need to manually update the `v1` tag you can do so with:

```shell
TAG="v$(cat package.json| jq -r '.version')"
git tag -a -m "$TAG" $TAG
git tag -a -m "$TAG" v1 -f
git push --tags -f
```

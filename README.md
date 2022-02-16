# action-setup-enos

This action can be run on `ubuntu-latest` and `macos-latest` GitHub Actions runners, and will install and expose a specified version of the `enos` CLI on the runner environment.

## Usage

Setup the `enos` CLI:

```yaml
steps:
- uses: hashicorp/action-setup-enos@v1
```

A specific version of the `enos` CLI can be installed:

```yaml
steps:
- uses: hashicorp/action-setup-enos
  with:
    version:
      0.0.19
```

## Inputs
The actions supports the following inputs:

- `version`: The version of `enos` to install, defaulting to `0.0.19`
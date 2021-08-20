# scan-unverified-actions

This action scans actions used in your workflow files and outputs those that are unverified by github.

## Inputs

|      Name       |   Type   | Required |       Default       |         Description         |
| :-------------: | :------: | :------: | :-----------------: | :-------------------------: |
| `workflows-dir` | `string` |    ✅    | `.github/workflows` | Path to workflows directory |

## Outputs

|            Name            |    Type    |                 Description                  |
| :------------------------: | :--------: | :------------------------------------------: |
| `found-unverified-actions` | `boolean`  | whether or not unverified actions were found |
|     `verified-actions`     | JSON Array |          the verified actions found          |
|    `unverified-actions`    | JSON Array |         the unverified actions found         |
|      `custom-actions`      | JSON Array |           the custom actions found           |
|     `unknown-actions`      | JSON Array |   actions the scanner couldn't understand    |

## Example usage

```yaml
jobs:
  job:
    runs-on: ubuntu-latest
    name: Find unverified actions
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Find unverified actions
        id: scan
        uses: gioragutt/scan-unverified-actions@v1

      - name: Print output
        run: |
          echo "Found? ${{ steps.scan.outputs.found-verified-actions }}"
          echo "Output ${{ steps.scan.outputs.unverified-actions }}"
```

# Development

First, fork the repo.

```bash
# Install dependencies after cloning
yarn

# Lint the code
yarn lint
yarn lint --fix

# Test the code
yarn test

# Bundle dist
yarn bundle
```

## Deployment

To deploy, make whatever code changes you want, followed by:

```bash
./deploy.sh "commit message"
```

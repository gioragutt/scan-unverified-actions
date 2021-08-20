# scan-unverified-actions

This action scans actions used in your workflow files and those that are unverified by github.

## Inputs

`scan-unverified-actions` has no inputs.

## Outputs

|           Name           |    Type    |                 Description                  |
| :----------------------: | :--------: | :------------------------------------------: |
| `found-verified-actions` | `boolean`  | Whether or not unverified actions were found |
|   `unverified-actions`   | JSON Array |         The unverified actions found         |

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

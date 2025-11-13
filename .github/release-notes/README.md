# Release Notes

This directory contains release notes for each version.

Create a new markdown file named after the version tag (e.g., `v1.2.0.md`) with corresponding release notes.

The GitHub Actions workflow will automatically include these notes in the release draft.

## Example

For version `v1.2.0`, create `v1.2.0.md`:

```markdown
## What's New

-   Added Steam Cloud storage warnings
-   Support for relative paths in backup configuration
-   Improved documentation

## Bug Fixes

-   Fixed path resolution for relative backup folders
```

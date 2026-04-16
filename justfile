# QuickPose React Native plugin

# List recipes
default:
    @just --list

# Print current version from package.json
version:
    @node -p "require('./package.json').version"

# Uncommitted changes + unpushed commits
changes:
    @git status --short
    @git log --oneline @{upstream}..HEAD 2>/dev/null | sed 's/^/unpushed: /' || true

# Bump version in package.json and commit (usage: just bump 0.3.4)
bump version:
    #!/usr/bin/env bash
    set -euo pipefail
    node -e "const p=require('./package.json'); p.version='{{ version }}'; require('fs').writeFileSync('./package.json', JSON.stringify(p,null,2)+'\n')"
    git add package.json
    git commit -m "chore: bump version to {{ version }}"
    echo "bumped to {{ version }}. Update CHANGELOG.md then run 'just release'."

# Release: push commit + tag. The GitHub Action (.github/workflows/publish.yml)
# publishes to npm on tag push via OIDC — no npm login or token required locally.
# Expects version in package.json already bumped and committed, CHANGELOG updated.
release:
    #!/usr/bin/env bash
    set -euo pipefail
    VERSION=$(node -p "require('./package.json').version")
    TAG="v${VERSION}"

    [[ -z "$(git status --porcelain | grep -v '^??')" ]] || { echo "Working tree has uncommitted tracked changes — commit first."; exit 1; }
    git rev-parse "$TAG" >/dev/null 2>&1 && { echo "Tag $TAG already exists locally."; exit 1; }

    echo "Pushing commits + tag ${TAG}..."
    git push origin main
    git tag "$TAG"
    git push origin "$TAG"

    echo ""
    echo "Tag pushed. GitHub Action will publish to npm in ~60s."
    echo "Watch: gh run watch"

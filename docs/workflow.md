---
title: Workflow Integration
description: Integrate better-dx tools into your development and CI/CD workflows.
---

# Workflow Integration

better-dx tools integrate seamlessly into your development workflow and CI/CD pipelines.

## Development Workflow

### Recommended Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun run build.ts",
    "lint": "bunx eslint .",
    "lint:fix": "bunx eslint . --fix",
    "format": "bunx clarity format .",
    "format:check": "bunx clarity check .",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "typecheck": "tsc --noEmit",
    "changelog": "bunx logsmith --output CHANGELOG.md",
    "release": "bun run changelog && bunx bumpx prompt",
    "docs": "bunx bunpress dev",
    "docs:build": "bunx bunpress build",
    "validate": "bun run lint && bun run typecheck && bun run test"
  }
}
```

### Git Hooks

Configure pre-commit and commit-msg hooks:

```json
{
  "git-hooks": {
    "pre-commit": {
      "staged-lint": {
        "*.{js,ts,tsx}": "bunx eslint --fix",
        "*.{json,yaml,yml}": "bunx prettier --write",
        "*.md": "bunx prettier --write"
      }
    },
    "commit-msg": "bunx gitlint --edit .git/COMMIT_EDITMSG",
    "pre-push": "bun run validate"
  }
}
```

## GitHub Actions

### CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Lint
        run: bun run lint

      - name: Type check
        run: bun run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build
```

### Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build

      - name: Generate changelog
        run: bunx logsmith --from $(git describe --tags --abbrev=0 HEAD^) --output RELEASE_NOTES.md

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body_path: RELEASE_NOTES.md
          files: |
            dist/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Documentation Deployment

Create `.github/workflows/docs.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build docs
        run: bun run docs:build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/.vitepress/dist
```

## Release Process

### Automated Release

1. **Make changes** and commit with conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

2. **Generate changelog**:
   ```bash
   bun run changelog
   ```

3. **Bump version** (interactive):
   ```bash
   bunx bumpx prompt
   ```

4. **Push with tags**:
   ```bash
   git push --follow-tags
   ```

### Manual Release Steps

```bash
# 1. Ensure all tests pass
bun run validate

# 2. Update changelog
bunx logsmith --output CHANGELOG.md

# 3. Commit changelog
git add CHANGELOG.md
git commit -m "docs: update changelog"

# 4. Bump version
bunx bumpx minor

# 5. Push
git push --follow-tags

# 6. Publish
npm publish
```

## Monorepo Workflow

For monorepo projects:

```json
{
  "scripts": {
    "lint": "bunx eslint packages/*/src",
    "test": "bun test packages/*/test",
    "build": "bun run build:all",
    "build:all": "for pkg in packages/*; do bun run --cwd $pkg build; done",
    "release": "bunx bumpx prompt --recursive"
  }
}
```

### Monorepo CI

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package:
          - core
          - utils
          - cli
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Test package
        run: bun test packages/${{ matrix.package }}/test
```

## Pre-commit Checklist

The following runs before every commit:

1. **ESLint** - Fixes auto-fixable issues on staged files
2. **Prettier** - Formats JSON/YAML/Markdown
3. **gitlint** - Validates commit message

## Pre-push Checklist

The following runs before every push:

1. **Full lint** - All files
2. **Type check** - TypeScript validation
3. **Tests** - Full test suite

## Dependency Updates

Keep dependencies updated:

```bash
# Check for updates
bunx npm-check-updates

# Update all dependencies
bunx npm-check-updates -u && bun install

# Update better-dx
bun update better-dx
```

### Automated Updates with Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: "chore(deps)"
    labels:
      - dependencies
```

## Best Practices

### 1. Use Conventional Commits

```bash
# Features
git commit -m "feat(auth): add OAuth2 support"

# Bug fixes
git commit -m "fix(api): handle null responses"

# Breaking changes
git commit -m "feat!: change API response format"
```

### 2. Run Validation Before Push

```bash
bun run validate
```

### 3. Keep Changelog Updated

Generate changelog before releases:

```bash
bun run changelog
```

### 4. Use Semantic Versioning

- `patch` - Bug fixes (0.0.X)
- `minor` - New features (0.X.0)
- `major` - Breaking changes (X.0.0)

## Troubleshooting

### Git Hooks Not Running

Reinstall hooks:

```bash
bunx bun-git-hooks install
```

### ESLint Configuration Issues

Reset ESLint cache:

```bash
bunx eslint . --cache --cache-location .eslintcache
```

### TypeScript Errors

Clear TypeScript cache:

```bash
rm -rf node_modules/.cache
bun run typecheck
```

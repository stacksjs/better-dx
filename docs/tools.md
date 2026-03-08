---
title: Included Tools
description: Overview of all development tools included in better-dx.
---

# Included Tools

better-dx bundles a carefully curated set of development tools for TypeScript and Bun projects.

## Version Management

### bumpx

Version bumping and release automation.

```bash
# Interactive version bump
bunx bumpx prompt

# Specific version bump
bunx bumpx patch
bunx bumpx minor
bunx bumpx major

# Recursive monorepo bump
bunx bumpx prompt --recursive
```

**Key Features:**
- Semantic versioning
- Monorepo support
- Git tag creation
- Pre/post release scripts

## Documentation

### bunpress

Static documentation generation powered by VitePress.

```bash
# Development server
bunx bunpress dev

# Build documentation
bunx bunpress build

# Preview build
bunx bunpress preview
```

**Key Features:**
- Markdown-based docs
- Vue components support
- Full-text search
- Dark mode

## Code Quality

### clarity

Code formatting with sensible defaults.

```bash
# Format files
bunx clarity format .

# Check formatting
bunx clarity check .
```

### pickier

Enhanced ESLint configuration.

```js
// eslint.config.js
import { config } from 'pickier'

export default config({
  typescript: true,
  vue: false,
  react: false,
})
```

**Included Rules:**
- TypeScript best practices
- Import ordering
- Code style consistency
- Security rules

## Git Workflow

### gitlint

Enforce conventional commit messages.

```bash
# Validate commit message
bunx gitlint --edit .git/COMMIT_EDITMSG

# Check a message directly
echo "feat: add new feature" | bunx gitlint
```

**Commit Format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Valid Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

### bun-git-hooks

Git hooks for Bun projects.

```json
{
  "git-hooks": {
    "pre-commit": {
      "staged-lint": {
        "*.{js,ts}": "bunx eslint --fix"
      }
    },
    "commit-msg": "bunx gitlint --edit .git/COMMIT_EDITMSG",
    "pre-push": "bun test"
  }
}
```

**Supported Hooks:**
- `pre-commit`
- `commit-msg`
- `pre-push`
- `post-merge`
- `post-checkout`

## Changelog

### logsmith

Automatic changelog generation from commits.

```bash
# Generate changelog
bunx logsmith --output CHANGELOG.md

# Preview changes
bunx logsmith --verbose

# Generate since specific tag
bunx logsmith --from v1.0.0
```

**Features:**
- Groups by commit type
- Links to commits
- Breaking changes section
- Customizable templates

## Configuration

### bunfig

Powerful configuration loading.

```ts
import { loadConfig } from 'bunfig'

const config = await loadConfig({
  name: 'myapp',
  defaults: {
    port: 3000,
    debug: false,
  },
})
```

**Supported Formats:**
- `.config.ts`
- `.config.js`
- `.config.json`
- `.config.yaml`
- Environment variables

## Build Tools

### bun-plugin-dtsx

TypeScript declaration file generation.

```ts
// build.ts
import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  plugins: [dts()],
})
```

**Features:**
- Declaration file generation
- Path resolution
- Type bundling

## Error Handling

### ts-error-handling

Structured error handling utilities.

```ts
import { Result, ok, err } from 'ts-error-handling'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err('Division by zero')
  }
  return ok(a / b)
}

const result = divide(10, 2)
if (result.ok) {
  console.log(result.value) // 5
}
```

## AI Assistant

### buddy-bot

AI-powered development assistant.

```bash
# Ask for help
bunx buddy "How do I configure ESLint?"

# Code review
bunx buddy review ./src/index.ts
```

## TypeScript

### Types

better-dx includes Bun types:

```ts
// Automatically available
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response('Hello!')
  },
})
```

## Using Multiple Tools

Combine tools in your workflow:

```json
{
  "scripts": {
    "lint": "bunx eslint .",
    "lint:fix": "bunx eslint . --fix",
    "format": "bunx clarity format .",
    "test": "bun test",
    "build": "bun run build.ts",
    "changelog": "bunx logsmith --output CHANGELOG.md",
    "release": "bun run changelog && bunx bumpx prompt --recursive",
    "docs": "bunx bunpress dev",
    "docs:build": "bunx bunpress build"
  },
  "git-hooks": {
    "pre-commit": {
      "staged-lint": {
        "*.{js,ts}": "bunx eslint --fix"
      }
    },
    "commit-msg": "bunx gitlint --edit .git/COMMIT_EDITMSG"
  }
}
```

## Next Steps

- [Configuration](/config) - Customize tool settings
- [Workflow Integration](/workflow) - CI/CD setup

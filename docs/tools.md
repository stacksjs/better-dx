---
title: Included Tools
description: Overview of all development tools included in better-dx.
---

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

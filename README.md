<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# better-dx

TypeScript is pinned to `7.1.0-dev.20261011.1`: its native compiler uses Go
1.27.2. The stable 7.0.2 compiler bundles Go 1.26.4, which is affected by
GO-2026-6604 and GO-2026-6612. Keep the compiler pin until a stable TypeScript
release includes the patched Go runtime.

All the development dependencies you need.

## Features

- Extremely light-weight & performant
- Release helper tooling
- Docs generator
- Code linting & formatting
- Git linting
- Changelog generator
- Automated dependency updates
- Powerful configuration loading & management

## Installation

```bash
bun add -d better-dx
npm install -D better-dx
```

And this sets up your project!

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/better-dx/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/better-dx/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://stacksjs.com/discord)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/better-dx?style=flat-square
[npm-version-href]: https://npmjs.com/package/better-dx
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/better-dx/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/better-dx/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/better-dx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/better-dx -->

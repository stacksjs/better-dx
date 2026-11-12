import { rm } from 'node:fs/promises'
import { dts } from '@dtsx/bun'

// Splitting produces content-hashed chunks. Package only this build's graph.
await rm('./dist', { recursive: true, force: true })

const result = await Bun.build({
  minify: true,
  entrypoints: ['src/index.ts', 'src/config.ts', 'src/types.ts'],
  outdir: './dist',
  target: 'bun',
  splitting: true,
  plugins: [dts({ moduleSpecifierMode: 'node' })],
})

if (!result.success)
  throw new AggregateError(result.logs, 'Library build failed')

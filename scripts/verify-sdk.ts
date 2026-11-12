import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, posix, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'

const root = resolve(import.meta.dir, '..')
const owner = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const evidenceRoot = process.env.BETTER_DX_SDK_EVIDENCE ?? tmpdir()
await mkdir(evidenceRoot, { recursive: true })
const evidence = await mkdtemp(join(evidenceRoot, 'better-dx-sdk-'))
const commands: Array<Record<string, unknown>> = []
const receipt = { kind: 'normally packed candidate SDK; not public release acceptance', status: 'FAIL', version: owner.version, evidence, commands, installations: [] as Array<Record<string, unknown>> }
const hash = (bytes: Uint8Array): string => new Bun.CryptoHasher('sha256').update(bytes).digest('hex')

async function run(args: string[], cwd: string, success = true): Promise<string> {
  const child = Bun.spawn(args, { cwd, stdin: 'ignore', stdout: 'pipe', stderr: 'pipe', timeout: 120_000 })
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
  const output = stdout + stderr
  const log = `${commands.length}.log`
  await writeFile(join(evidence, log), output)
  commands.push({ args, cwd, code, log })
  assert.equal(code === 0, success, output)
  assert.notEqual(code, null, output)
  return output
}

interface Member { path: string, mode: number, bytes: Uint8Array }

// Bun's normal pack output uses ordinary tar files/directories. Inspect the
// original headers so an install cannot hide missing files or repaired modes.
function members(archive: Uint8Array): Member[] {
  const tar = gunzipSync(archive)
  const result: Member[] = []
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512)
    if (header.every(byte => byte === 0)) break
    const text = (start: number, size: number): string => header.subarray(start, start + size).toString().replace(/\0.*$/s, '').trim()
    const name = [text(345, 155), text(0, 100)].filter(Boolean).join('/')
    assert(name.startsWith('package/') && !name.split('/').includes('..') && !name.includes('\\'), name)
    const size = Number.parseInt(text(124, 12) || '0', 8)
    const mode = Number.parseInt(text(100, 8), 8) & 0o777
    assert(Number.isSafeInteger(size) && size >= 0 && offset + 512 + size <= tar.length)
    const type = header[156]
    assert(type === 0 || type === 48 || type === 53, `Unexpected archive member type ${type}: ${name}`)
    if (type !== 53) {
      assert(!result.some(member => member.path === name), name)
      result.push({ path: name.slice('package/'.length), mode, bytes: tar.subarray(offset + 512, offset + 512 + size) })
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  assert(result.length > 0)
  return result
}

async function packageAt(name: string, from: string): Promise<{ path: string, manifest: any }> {
  let path = dirname(Bun.resolveSync(name, from))
  while (true) {
    if (existsSync(join(path, 'package.json'))) {
      const manifest = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'))
      if (manifest.name === name) return { path, manifest }
    }
    const parent = dirname(path)
    assert.notEqual(parent, path, `Cannot resolve ${name}'s package manifest`)
    path = parent
  }
}

try {
  assert.equal(owner.dependencies.typescript, '7.1.0-dev.20261011.1')
  assert.equal(owner.overrides.typescript, owner.dependencies.typescript)
  for (const name of ['index', 'config', 'types']) {
    assert(existsSync(join(root, `dist/${name}.js`)), `Build the final runtime entry ${name} first`)
    assert(existsSync(join(root, `dist/${name}.d.ts`)), `Build the final declaration entry ${name} first`)
  }
  const archive = join(evidence, 'better-dx.tgz')
  await run([process.execPath, 'pm', 'pack', '--filename', archive], root)
  const original = await readFile(archive)
  const inventory = members(original)
  const runtimeFiles = new Map(inventory.filter(member => member.path.endsWith('.js')).map(member => [member.path, member]))
  const reached = new Set<string>()
  const pending = ['dist/index.js', 'dist/config.js', 'dist/types.js']
  const scanner = new Bun.Transpiler({ loader: 'js' })
  while (pending.length) {
    const name = pending.pop()!
    if (reached.has(name)) continue
    const file = runtimeFiles.get(name)
    assert(file, `Advertised runtime graph is missing ${name}`)
    reached.add(name)
    for (const reference of scanner.scanImports(file.bytes)) {
      if (reference.path.startsWith('.')) pending.push(posix.join(posix.dirname(name), reference.path))
    }
  }
  assert.deepEqual([...runtimeFiles.keys()].filter(name => !reached.has(name)), [], 'Do not publish stale runtime chunks from a previous build')
  await writeFile(join(evidence, 'original-members.json'), JSON.stringify(inventory.map(member => ({ path: member.path, mode: member.mode, sha256: hash(member.bytes) })), null, 2))
  await writeFile(join(evidence, 'archive-sha256.txt'), `${hash(original)}\n`)
  const consumer = join(evidence, 'consumer')
  await mkdir(consumer)
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'better-dx-sdk-contract', private: true, type: 'module', dependencies: { 'better-dx': `file:${archive}` }, devDependencies: { typescript: owner.dependencies.typescript } }, null, 2))
  await writeFile(join(consumer, 'development.config.ts'), 'export default { verbose: false }\n')
  await writeFile(join(consumer, 'runtime.ts'), `import assert from 'node:assert/strict'
import * as root from 'better-dx'
import * as config from 'better-dx/config'
import * as types from 'better-dx/types'
assert.equal(root.config, config.config)
assert.equal(root.defaultConfig, config.defaultConfig)
assert.equal(root.getConfig, config.getConfig)
assert.deepEqual(Object.keys(types), [])
const loaded = await root.getConfig()
assert.equal(loaded.verbose, false)
assert.equal(await config.getConfig(), loaded)
console.log('advertised runtime subpaths and shared configuration identity PASS')
`)
  const positive = `import { config, defaultConfig, getConfig, type DXConfig } from 'better-dx'
import { config as subpath, getConfig as getSubpath } from 'better-dx/config'
import type { DXConfig as SubpathConfig } from 'better-dx/types'
type IsAny<T> = 0 extends (1 & T) ? true : false
type NoAny<T extends false> = T
type ConfigCheck = NoAny<IsAny<DXConfig>>
type ValueCheck = NoAny<IsAny<typeof config.verbose>>
type AsyncCheck = NoAny<IsAny<Awaited<ReturnType<typeof getConfig>>>>
const value: boolean = config.verbose
const other: DXConfig = subpath
const same: SubpathConfig = defaultConfig
const asynchronous: Promise<DXConfig> = getSubpath()
void [value, other, same, asynchronous]
`
  await writeFile(join(consumer, 'positive.ts'), positive)
  await writeFile(join(consumer, 'negative.ts'), `${positive}\nconst invalid: number = config.verbose\nvoid invalid\n`)
  let lock: string | undefined
  for (const frozen of [false, true]) {
    if (frozen) await rm(join(consumer, 'node_modules'), { recursive: true })
    await run([process.execPath, 'install', ...(frozen ? ['--frozen-lockfile'] : [])], consumer)
    const currentLock = await readFile(join(consumer, 'bun.lock'), 'utf8')
    if (frozen) assert.equal(currentLock, lock)
    else lock = currentLock
    const installed = await packageAt('better-dx', consumer)
    assert.equal(installed.manifest.version, owner.version)
    for (const member of inventory) {
      const path = join(installed.path, member.path)
      assert.equal(hash(await readFile(path)), hash(member.bytes), member.path)
      assert.equal((await stat(path)).mode & 0o777, member.mode, member.path)
    }
    const plugin = await packageAt('@dtsx/bun', installed.path)
    const core = await packageAt('@dtsx/dtsx', plugin.path)
    const bumpx = await packageAt('@stacksjs/bumpx', installed.path)
    const compiler = await packageAt('typescript', consumer)
    assert(Bun.semver.satisfies(plugin.manifest.version, '>=0.11.53'))
    assert.equal(core.manifest.version, plugin.manifest.version)
    assert(Bun.semver.satisfies(bumpx.manifest.version, '>=0.2.35'))
    assert.equal(compiler.manifest.version, owner.dependencies.typescript)
    assert.equal(installed.manifest.dependencies['bun-plugin-dtsx'], undefined)
    receipt.installations.push({ frozen, members: inventory.length, installedBytesAndModesEqual: true, plugin: plugin.manifest.version, core: core.manifest.version, bumpx: bumpx.manifest.version, typescript: compiler.manifest.version, lockSHA256: hash(new TextEncoder().encode(currentLock)) })
    await run([process.execPath, 'runtime.ts'], consumer)
    // Resolve from the owning bundle; keep all probes outside its payload.
    const resolvedBumpx = Bun.resolveSync('@stacksjs/bumpx', installed.path)
    const resolvedPlugin = Bun.resolveSync('@dtsx/bun', installed.path)
    const library = join(consumer, 'declaration-library')
    await mkdir(join(library, 'src'), { recursive: true })
    await writeFile(join(library, 'package.json'), '{"type":"module"}')
    await writeFile(join(library, 'src/index.ts'), 'export interface Options { count: number }\nexport const answer: Options = { count: 42 }\n')
    await writeFile(join(consumer, 'tools.ts'), `import assert from 'node:assert/strict'\nimport { incrementVersion } from ${JSON.stringify(resolvedBumpx)}\nimport { dts } from ${JSON.stringify(resolvedPlugin)}\nassert.equal(incrementVersion('1.2.3', 'patch'), '1.2.4')\nconst result = await Bun.build({ entrypoints: [${JSON.stringify(join(library, 'src/index.ts'))}], outdir: ${JSON.stringify(join(library, 'dist'))}, target: 'node', plugins: [dts({ cwd: ${JSON.stringify(library)}, root: './src', outdir: './dist', moduleSpecifierMode: 'node' })] })\nassert(result.success, result.logs.map(log => log.message).join('\\n'))\nconsole.log('bundled Bumpx and declaration producer PASS')\n`)
    await run([process.execPath, 'tools.ts'], consumer)
    for (const folder of ['src', 'dist']) {
      const control = `import { answer } from './declaration-library/${folder}/index.js'\ntype IsAny<T> = 0 extends (1 & T) ? true : false\ntype NoAny<T extends false> = T\ntype Check = NoAny<IsAny<typeof answer.count>>\nconst count: number = answer.count\nvoid count\n`
      await writeFile(join(consumer, 'declaration-positive.ts'), control)
      await writeFile(join(consumer, 'declaration-negative.ts'), `${control}\nconst invalid: string = answer.count\nvoid invalid\n`)
      for (const invalid of [false, true]) {
        await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, skipLibCheck: false, target: 'ESNext', module: 'NodeNext', moduleResolution: 'NodeNext', types: [], paths: {}, noEmit: true }, files: [invalid ? 'declaration-negative.ts' : 'declaration-positive.ts'] }))
        const output = await run([process.execPath, join(compiler.path, 'lib/tsc.js'), '--project', 'tsconfig.json'], consumer, !invalid)
        if (invalid) assert.deepEqual(output.match(/error TS\d+/g), ['error TS2322'], output)
      }
    }
    for (const mode of ['NodeNext', 'Bundler']) {
      const compilerOptions = { strict: true, skipLibCheck: false, target: 'ESNext', module: mode === 'NodeNext' ? 'NodeNext' : 'Preserve', moduleResolution: mode, types: [], paths: {}, noEmit: true }
      for (const invalid of [false, true]) {
        await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions, files: [invalid ? 'negative.ts' : 'positive.ts'] }))
        const output = await run([process.execPath, join(compiler.path, 'lib/tsc.js'), '--project', 'tsconfig.json'], consumer, !invalid)
        if (invalid) assert.deepEqual(output.match(/error TS\d+/g), ['error TS2322'], output)
      }
    }
    for (const member of inventory) {
      const path = join(installed.path, member.path)
      assert.equal(hash(await readFile(path)), hash(member.bytes), member.path)
      assert.equal((await stat(path)).mode & 0o777, member.mode, member.path)
    }
  }
  receipt.status = 'PASS'
  console.log(`SDK subpaths, strict NodeNext/Bundler consumers, shared config and bundled tools PASS: ${evidence}`)
}
finally {
  await writeFile(join(evidence, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`)
}

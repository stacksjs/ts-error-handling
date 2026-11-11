import { expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// Build explicitly first. Published archives use the identical consumer gate.
test('the installed Result package preserves discriminants and runtime outcomes', async () => {
  const directory = await mkdtemp(join(process.env.RESULT_PACKAGE_EVIDENCE ?? tmpdir(), 'result-package-'))
  const consumer = join(directory, 'consumer')
  const archive = join(directory, 'package.tgz')
  const commands: Array<Record<string, unknown>> = []
  const receipt: Record<string, unknown> = { directory, commands, completed: false }
  const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')
  async function run(phase: string, args: string[], cwd: string) {
    const env = { ...process.env }
    for (const key of Object.keys(env)) {
      if (/token|password|secret|private_key|^npm_config_|^bun_auth_/i.test(key)) delete env[key]
    }
    const child = Bun.spawn(args, { cwd, env, stdout: 'pipe', stderr: 'pipe', timeout: 120_000 })
    const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    const output = stdout + stderr
    const log = `${commands.length}-${phase}.log`
    await writeFile(join(directory, log), output)
    commands.push({ phase, args, cwd, code, log })
    return { code, output }
  }
  try {
    const supplied = process.env.RESULT_PACKAGE_ARCHIVE
    if (supplied) {
      receipt.archiveInput = resolve(supplied)
      await copyFile(resolve(supplied), archive)
    }
    else {
      const packed = await run('pack', [process.execPath, '--no-env-file', 'pm', 'pack', '--filename', archive], resolve(import.meta.dir, '..'))
      expect(packed.code, packed.output).toBe(0)
    }
    const bytes = await readFile(archive)
    receipt.archiveSHA256 = hash(bytes)
    const files = await new Bun.Archive(bytes).files()
    const manifest = await files.get('package/package.json')!.json()
    expect(manifest.name).toBe('ts-error-handling')
    receipt.version = manifest.version
    await mkdir(consumer)
    const consumerManifest = { private: true, type: 'module', dependencies: { 'ts-error-handling': `file:${archive}` }, devDependencies: { typescript: '7.0.2', '@types/bun': '1.4.4' } }
    receipt.consumerManifest = consumerManifest
    await writeFile(join(consumer, 'package.json'), JSON.stringify(consumerManifest))
    const compilerOptions = { target: 'ESNext', module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: false, paths: {}, types: [], noEmit: true }
    receipt.compilerOptions = compilerOptions
    await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions, files: ['control.ts'] }))
    for (const flags of [[], ['--frozen-lockfile']]) {
      const installed = await run(flags.length ? 'frozen-install' : 'install', [process.execPath, '--no-env-file', 'install', ...flags], consumer)
      expect(installed.code, installed.output).toBe(0)
      const lock = hash(await readFile(join(consumer, 'bun.lock')))
      if (flags.length) {
        const previous = receipt.lockSHA256
        if (typeof previous !== 'string') throw new Error('The normal installation must establish a lock hash')
        expect(lock).toBe(previous)
      }
      else receipt.lockSHA256 = lock
    }
    for (const [name, file] of files) {
      expect(name.startsWith('package/') && !name.split('/').includes('..')).toBe(true)
      const installed = await readFile(join(consumer, 'node_modules/ts-error-handling', name.slice('package/'.length)))
      expect(hash(installed), name).toBe(hash(new Uint8Array(await file.arrayBuffer())))
    }
    receipt.installedFiles = files.size
    const compiler = await Bun.file(join(consumer, 'node_modules/typescript/package.json')).json()
    expect(compiler.version).toBe('7.0.2')
    receipt.compiler = compiler.version
    const prefix = `import { ok, err } from 'ts-error-handling';
import type { Result } from 'ts-error-handling';
declare const result: Result<number, string>;
type IsAny<T> = 0 extends (1 & T) ? true : false;`
    const controls = [
      { text: `const success: Result<number, string> = ok(3);
const failure: Result<number, string> = err('failed');
if (result.isOk) { const value: number = result.value; const tag: 'Ok' = result._tag; const noError: false = result.isErr; }
if (result.isErr) { const error: string = result.error; const tag: 'Err' = result._tag; const noSuccess: false = result.isOk; }
if (result._tag === 'Ok') { const value: number = result.value; }
const safe: false = null as unknown as IsAny<ReturnType<typeof ok<number>>>;` },
      { code: 2322, text: 'if (result.isOk) { const wrong: string = result.value; }' },
      { code: 2339, text: 'if (result.isErr) { const wrong = result.value; }' },
    ]
    for (const [index, control] of controls.entries()) {
      await writeFile(join(consumer, 'control.ts'), `${prefix}\n${control.text}\n`)
      const checked = await run(`control-${index}`, [process.execPath, '--no-env-file', join(consumer, 'node_modules/typescript/lib/tsc.js'), '--project', 'tsconfig.json'], consumer)
      expect(checked.code === 0, checked.output).toBe(index === 0)
      if ('code' in control) {
        expect(checked.output.match(/error TS\d+/g), checked.output).toEqual([`error TS${control.code}`])
        expect(checked.output).toContain('control.ts(')
      }
    }
    await writeFile(join(consumer, 'runtime.ts'), `import { ok, err } from 'ts-error-handling';
const success = ok(3).map(value => value + 2);
const failure = err('failed').mapErr(value => value.toUpperCase());
if (!success.isOk || success.isErr || success._tag !== 'Ok' || success.value !== 5) throw new Error('wrong success');
if (!failure.isErr || failure.isOk || failure._tag !== 'Err' || failure.error !== 'FAILED') throw new Error('wrong failure');
console.log('PASS installed Result runtime');`)
    const runtime = await run('runtime', [process.execPath, '--no-env-file', 'runtime.ts'], consumer)
    expect(runtime.code, runtime.output).toBe(0)
    expect(runtime.output.trim()).toBe('PASS installed Result runtime')
    receipt.completed = true
  }
  finally {
    await writeFile(join(directory, 'receipt.json'), JSON.stringify(receipt, null, 2))
    await rm(join(consumer, 'node_modules'), { recursive: true, force: true })
    if (!process.env.RESULT_PACKAGE_EVIDENCE) await rm(directory, { recursive: true, force: true })
  }
}, 180_000)

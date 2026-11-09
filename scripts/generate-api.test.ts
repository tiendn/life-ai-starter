import { execFile } from 'node:child_process'
import { link, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'

const run = promisify(execFile)
// Run the Node-only generator in its real runtime, outside jsdom's URL realm.
function generateApiTypes(input: string, output: string, check = false) {
  return run(process.execPath, ['--import', 'tsx', 'scripts/generate-api.ts',
    '--input', input, '--output', output, ...(check ? ['--check'] : [])], { timeout: 15_000 })
}
const directories: string[] = []
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'starter-openapi-'))
  directories.push(root)
  const input = join(root, 'openapi.json')
  const output = join(root, 'generated/schema.d.ts')
  // Synthetic contract used only by generator tests, never shipped as a live API.
  await writeFile(input, JSON.stringify({ openapi: '3.1.0', info: { title: 'Test only', version: '1' }, paths: {
    '/health': { get: { operationId: 'testHealth', responses: { 200: { description: 'Test response', content: {
      'application/json': { schema: { type: 'object', required: ['amount', 'observed'], properties: {
        amount: { type: 'string' }, observed: { type: ['string', 'null'] },
      } } },
    } } } } },
  } }))
  return { root, input, output }
}
afterEach(async () => { await Promise.all(directories.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

describe('offline OpenAPI type generation', () => {
  it('generates deterministically, retaining decimal strings and nullable fields', async () => {
    const { input, output } = await fixture()
    await generateApiTypes(input, output)
    const original = await readFile(output, 'utf8')
    expect(original).toContain('amount: string')
    expect(original).toContain('observed: string | null')
    await generateApiTypes(input, output)
    expect(await readFile(output, 'utf8')).toBe(original)
    await generateApiTypes(input, output, true)
  })
  it('detects missing/stale types without changing files', async () => {
    const { input, output } = await fixture()
    await expect(generateApiTypes(input, output, true)).rejects.toThrow('missing or stale')
    await generateApiTypes(input, output)
    await writeFile(output, 'stale')
    await expect(generateApiTypes(input, output, true)).rejects.toThrow('missing or stale')
    expect(await readFile(output, 'utf8')).toBe('stale')
  })
  it('preserves prior types when the schema is missing/invalid and protects the source file', async () => {
    const { input, output } = await fixture()
    await generateApiTypes(input, output)
    const original = await readFile(output, 'utf8')
    await expect(generateApiTypes(input, input)).rejects.toThrow('different files')
    await writeFile(input, '{invalid')
    await expect(generateApiTypes(input, output)).rejects.toThrow()
    await expect(generateApiTypes(input + '.missing', output)).rejects.toThrow()
    expect(await readFile(output, 'utf8')).toBe(original)
  })
  it('rejects symlink/hardlink output aliases without overwriting the source schema', async () => {
    const { root, input } = await fixture()
    const original = await readFile(input, 'utf8')
    for (const [name, createAlias] of [['symlink', symlink], ['hardlink', link]] as const) {
      const output = join(root, name + '.json')
      await createAlias(input, output)
      await expect(generateApiTypes(input, output)).rejects.toThrow('different files')
      expect(await readFile(input, 'utf8')).toBe(original)
    }
  })
  it('exposes CLI generate/check commands and rejects missing arguments', async () => {
    const { input, output } = await fixture()
    const command = ['--import', 'tsx', 'scripts/generate-api.ts']
    await expect(run(process.execPath, command, { timeout: 15_000 })).rejects.toMatchObject({ code: 1 })
    await run(process.execPath, [...command, '--input', input, '--output', output], { timeout: 15_000 })
    await run(process.execPath, [...command, '--input', input, '--output', output, '--check'], { timeout: 15_000 })
    await writeFile(output, 'stale')
    await expect(run(process.execPath, [...command, '--input', input, '--output', output, '--check'], { timeout: 15_000 })).rejects.toMatchObject({ code: 1 })
  })
})

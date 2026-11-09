import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

/** Generate from an explicitly supplied local backend contract, never a fabricated production API. */
export async function generateApiTypes(input: string, output: string, check = false) {
  const source = resolve(input)
  const target = resolve(output)
  if (source === target) throw new Error('Input and output must be different files')
  const sourceIdentity = await stat(source)
  const targetIdentity = await stat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return undefined
    throw error
  })
  if (targetIdentity && sourceIdentity.dev === targetIdentity.dev && sourceIdentity.ino === targetIdentity.ino) {
    throw new Error('Input and output must be different files')
  }
  const result = '/** Generated from OpenAPI. Do not edit; run api:generate. */\n' +
    astToString(await openapiTS(pathToFileURL(source)))
  if (check) {
    const current = await readFile(target, 'utf8').catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })
    if (current !== result) throw new Error('API types are missing or stale; rerun api:generate with the same --input and --output')
  } else {
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, result)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: {
    input: { type: 'string' }, output: { type: 'string' }, check: { type: 'boolean', default: false },
  } })
  if (!values.input || !values.output) throw new Error('Usage: api:generate --input path/to/openapi.json --output src/core/api/generated/schema.d.ts [--check]')
  await generateApiTypes(values.input, values.output, values.check)
}

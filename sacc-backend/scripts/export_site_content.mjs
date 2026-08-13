import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const sourcePath = resolve(scriptDir, '../../UIDemo/sacc-home/src/content/siteContent.ts')
const outputPath = resolve(scriptDir, '../app/data/site_content.json')
const { fallbackSiteContent } = await import(pathToFileURL(sourcePath).href)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(fallbackSiteContent, null, 2)}\n`, 'utf8')

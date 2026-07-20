import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const workspaceRoot = resolve(projectRoot, '..')

const filesToSync = [
  ['SACC.pen', 'public/SACC.pen'],
  ['download.png', 'public/download.png'],
]

filesToSync.forEach(([sourceRelativePath, targetRelativePath]) => {
  const sourcePath = resolve(workspaceRoot, sourceRelativePath)
  const targetPath = resolve(projectRoot, targetRelativePath)

  if (!existsSync(sourcePath)) {
    throw new Error(`缺少设计资源：${sourcePath}`)
  }

  mkdirSync(dirname(targetPath), { recursive: true })
  copyFileSync(sourcePath, targetPath)
})

console.log('SACC 设计稿资源已同步到 sacc-home/public。')

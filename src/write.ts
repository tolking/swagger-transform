import { resolve } from 'node:path'
import { mkdir, writeFile } from 'node:fs'

export function write(outDir: string, name: string, data: string) {
  const path = resolve(outDir, name)

  mkdir(resolve(outDir), { recursive: true }, () => {
    writeFile(path, data, (err) => {
      if (err) throw new Error(`[swagger-transform Error]: ${err}`)
    })
  })
}

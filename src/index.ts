import type { SFCBlock } from 'vue/compiler-sfc'
import type { InputFile, Loader, LoaderContext, LoaderResult, OutputFile } from './mkdist'

import fs from 'node:fs'
import { dirname, resolve } from 'pathe'

import { compileScript, parse } from 'vue/compiler-sfc'

export interface DefineVueLoaderOptions {
  blockLoaders?: {
    [blockType: string]: VueBlockLoader | undefined
  }
}

export interface VueBlockLoader {
  (
    block: Pick<SFCBlock, 'type' | 'content' | 'attrs'>,
    context: LoaderContext & {
      rawInput: InputFile
      blocks: SFCBlock[]
      addOutput: (...files: OutputFile[]) => void
    }
  ): Awaitable<Pick<SFCBlock, 'type' | 'content' | 'attrs'> | undefined>
}

export interface DefaultBlockLoaderOptions {
  type: 'script' | 'style' | 'template' | (string & {})
  outputLang: string
  defaultLang?: string
  validExtensions?: string[]
}

export function defineVueLoader(options?: DefineVueLoaderOptions): Loader {
  const blockLoaders = options?.blockLoaders || {}

  return async (input, context) => {
    if (input.extension !== '.vue') {
      return
    }

    const raw = await input.getContents()
    const sfc = parse(raw, { ignoreEmpty: true })

    if (sfc.errors.length > 0) {
      sfc.errors.forEach(error => console.error(error))
      return [{ path: input.path, contents: raw }]
    }

    const output: LoaderResult = []
    const addOutput = (...files: OutputFile[]) => output.push(...files)

    const blocks = [
      sfc.descriptor.template,
      ...sfc.descriptor.styles,
      ...sfc.descriptor.customBlocks,
    ].filter(item => !!item)
    // merge script blocks
    if (sfc.descriptor.script || sfc.descriptor.scriptSetup) {
      const merged = compileScript(sfc.descriptor, { id: input.path, fs: createFs(input) })
      merged.setup = false
      merged.attrs = toOmit(merged.attrs, 'setup')
      blocks.unshift(merged)
    }

    const results = await Promise.all(
      blocks.map(async (data) => {
        const blockLoader = blockLoaders[data.type]
        return await blockLoader?.(data, { ...context, rawInput: input, blocks, addOutput }) ?? data
      }),
    )

    const contents = results.map((block) => {
      const attrs = Object.entries(block.attrs)
        .map(
          ([key, value]) => {
            if (!value) {
              return undefined
            }

            return value === true ? key : `${key}="${value}"`
          },
        )
        .filter(item => !!item)
        .join(' ')

      const header = `<${(`${block.type} ${attrs}`).trim()}>`
      const footer = `</${block.type}>`

      return `${header}\n${cleanupBreakline(block.content)}\n${footer}\n`
    }).join('\n')
    addOutput({
      path: input.path,
      srcPath: input.srcPath,
      extension: '.vue',
      contents,
      declaration: false,
    })

    return output
  }
}

export function defineDefaultBlockLoader(options: DefaultBlockLoaderOptions): VueBlockLoader {
  return async (block, { loadFile, rawInput, addOutput }) => {
    if (options.type !== block.type) {
      return
    }

    const lang = typeof block.attrs.lang === 'string'
      ? block.attrs.lang
      : options.outputLang
    const extension = `.${lang}`

    const files
      = (await loadFile({
        getContents: () => block.content,
        path: `${rawInput.path}${extension}`,
        srcPath: `${rawInput.srcPath}${extension}`,
        extension,
      })) || []

    const blockOutputFile = files.find(
      f =>
        f.extension === `.${options.outputLang}`
        || options.validExtensions?.includes(f.extension as string),
    )
    if (!blockOutputFile?.contents) {
      return
    }
    addOutput(...files.filter(f => f !== blockOutputFile))

    return {
      type: block.type,
      attrs: toOmit(block.attrs, 'lang'),
      content: blockOutputFile.contents,
    }
  }
}

const styleLoader = defineDefaultBlockLoader({
  outputLang: 'css',
  type: 'style',
})

const scriptLoader = defineDefaultBlockLoader({
  outputLang: 'js',
  type: 'script',
  validExtensions: ['.js', '.mjs'],
})

export const vueLoader = defineVueLoader({
  blockLoaders: {
    style: styleLoader,
    script: scriptLoader,
  },
})

function createFs(input: InputFile) {
  const realpath = (...paths: string[]) => input.srcPath
    ? resolve(dirname(input.srcPath), ...paths)
    : resolve(...paths)
  const fileExists = (file: string) => {
    try {
      if (!input.srcPath) {
        return false
      }
      const path = realpath(file)

      fs.accessSync(path)
      return fs.lstatSync(path).isFile()
    }
    catch {
      return false
    }
  }
  const readFile = (file: string) => {
    return fs.readFileSync(realpath(file), 'utf-8')
  }

  return { realpath, fileExists, readFile }
}
function cleanupBreakline(str: string): string {
  return str.replaceAll(/(\n\n)\n+/g, '\n\n').replace(/^\s*\n|\n\s*$/g, '')
}
function toOmit<R extends Record<keyof object, unknown>, K extends keyof R>(record: R, toRemove: K): Omit<R, K> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key !== toRemove)) as Omit<R, K>
}

type Awaitable<T> = T | Promise<T>

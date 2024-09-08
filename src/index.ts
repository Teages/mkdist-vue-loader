import fs from 'node:fs'
import { dirname, resolve } from 'pathe'

import type { SFCBlock, SFCScriptBlock, SFCStyleBlock, SFCTemplateBlock } from 'vue/compiler-sfc'
import { compileScript, parse } from 'vue/compiler-sfc'

import type { InputFile, Loader, LoaderContext, LoaderResult } from './mkdist'

export interface DefineVueLoaderOptions {
  transfer?: {
    script?: VueBlockTransfer<SFCScriptBlock>
    template?: VueBlockTransfer<SFCTemplateBlock>
    style?: VueBlockTransfer<SFCStyleBlock>
    [customBlockType: string]: VueBlockTransfer<any> | undefined
  }
}

export interface VueBlockTransfer<T extends SFCBlock = SFCBlock> {
  (
    content: Pick<T, 'type' | 'content' | 'attrs'>,
    context: LoaderContext & {
      raw: InputFile
      blocks: SFCBlock[]
      addOutput: (path: string, contents: string) => void
    }
  ): Awaitable<Pick<T, 'type' | 'content' | 'attrs'>>
}

export const defaultBlockLoader: VueBlockTransfer = async ({ type, content, attrs }, context) => {
  if (type === 'script') {
    throw new Error('The script block loader is not supported.')
  }

  const lang = typeof attrs.lang === 'string'
    ? attrs.lang
    : ({
        template: 'html',
        style: 'css',
      }[type] ?? '')
  const extension = `.${lang}`

  const outputs = await context.loadFile({
    getContents: () => content,
    path: `${context.raw.path}${extension}`,
    srcPath: `${context.raw.srcPath}${extension}`,
    extension,
  }) || []

  const [output, ...files] = outputs
  files.forEach(({ path, contents }) => contents && context.addOutput(path, contents))

  if (output) {
    const { contents: outputContent, extension } = output
    let outputLang = extension?.replace(/^\./, '')

    const defaultLangs = [
      { type: 'template', lang: 'html' },
      { type: 'style', lang: 'css' },
    ]
    const isDefaultLang = defaultLangs.some(defaultLang => (defaultLang.type === type && defaultLang.lang === outputLang))
    if (isDefaultLang) {
      outputLang = undefined
    }
    else {
      outputLang = extension?.replace(/^\./, '')
    }
    const outputAttrs = Object.fromEntries(
      Object.entries({ ...attrs, lang: outputLang })
        .filter(([_key, value]) => !!value),
    ) as Record<string, string | true>

    return {
      type,
      content: output.raw ? content : outputContent ?? '',
      attrs: outputAttrs,
    }
  }

  return { type, content, attrs }
}

export function defineVueLoader(options?: DefineVueLoaderOptions): Loader {
  const transfer = options?.transfer || {}

  return async (input, context) => {
    if (input.extension !== '.vue') {
      return
    }

    const contents = await input.getContents()
    const sfc = parse(contents, {})

    if (sfc.errors.length > 0) {
      sfc.errors.forEach(error => console.error(error))
      return [{ path: input.path, contents }]
    }

    const output: LoaderResult = []
    const addOutput = (path: string, contents: string) => output.push({ path, contents })

    const blocks = [
      ...sfc.descriptor.customBlocks,
      ...sfc.descriptor.styles,
      sfc.descriptor.template,
      sfc.descriptor.script,
      sfc.descriptor.scriptSetup,
    ].filter(item => !!item)

    let handledScript = false
    const results = await Promise.all(
      blocks.map((data) => {
        const { type, attrs } = data

        let content = data.content
        if (type === 'script') {
          // avoid handling script block multiple times
          if (handledScript) {
            return undefined
          }
          handledScript = true

          // compile the script block amd script setup block into one script block
          attrs.setup = undefined as any
          const scriptResult = compileScript(sfc.descriptor, { id: input.path, fs: createFs(input) })
          content = scriptResult.content

          // tell mkdist to generate dts
          if (context.options.declaration) {
            output.push({
              path: `${input.path}.ts`,
              srcPath: `${input.srcPath}.ts`,
              extension: '.d.ts',
              contents: content,
              declaration: true,
            })
          }
        }

        const block = { type, content, attrs }
        const transferFunc = transfer[type] ?? defaultBlockLoader
        return transferFunc(block, { ...context, raw: input, blocks, addOutput })
      }),
    ).then(items => items.filter(item => !!item))

    const vueFile = results.reduceRight((acc, block) => {
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

      return `${trimBreakLine(acc)}\n\n${header}\n${trimBreakLine(block.content)}\n${footer}\n`
    }, '')
    output.push({
      path: input.path,
      srcPath: input.srcPath,
      extension: '.vue',
      contents: vueFile,
      declaration: false,
    })
    return output
  }
}

export const defaultScriptLoader: VueBlockTransfer<SFCScriptBlock> = async ({ type, content, attrs }, context) => {
  const outputs = await context.loadFile({
    getContents: () => content,
    path: `${context.raw.path}.ts`,
    srcPath: `${context.raw.srcPath}.ts`,
    extension: '.ts',
  }) || []

  // compile the script block to pure js
  const output = outputs.filter(output => output.extension === '.mjs')[0]
  if (!output || !output.contents) {
    // failed to compile, fallback to the original content
    return { type, content, attrs }
  }

  return {
    type,
    content: output.contents,
    attrs: Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'lang')),
  }
}
export const defaultStyleLoader: VueBlockTransfer<SFCStyleBlock> = defaultBlockLoader as VueBlockTransfer<SFCStyleBlock>
export const defaultTemplateLoader: VueBlockTransfer<SFCTemplateBlock> = defaultBlockLoader as VueBlockTransfer<SFCTemplateBlock>

export const vueLoader = defineVueLoader({
  transfer: {
    script: defaultScriptLoader,
    style: defaultStyleLoader,
    template: defaultTemplateLoader,
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

function trimBreakLine(str: string): string {
  return str.replace(/\n$/, '').replace(/^\n/, '')
}

type Awaitable<T> = T | Promise<T>

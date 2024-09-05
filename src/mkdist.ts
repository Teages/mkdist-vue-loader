import type { MkdistOptions } from 'mkdist'

// The following types are copied from mkdist, they should be same to below types.

// export type Loader = Exclude<NonNullable<MkdistOptions['loaders']>[number], string>
// export type LoaderResult = Awaited<ReturnType<Loader>>
// export type InputFile = Parameters<Loader>[0]
// export type LoaderContext = Parameters<Loader>[1]

export type Loader = (input: InputFile, context: LoaderContext) => LoaderResult | Promise<LoaderResult>

type LoadFile = (input: InputFile) => LoaderResult | Promise<LoaderResult>

type LoaderOptions = Pick<
  MkdistOptions,
  | 'ext'
  | 'format'
  | 'declaration'
  | 'esbuild'
  | 'postcss'
>

export interface LoaderContext {
  loadFile: LoadFile
  options: LoaderOptions
}

export type LoaderResult = OutputFile[] | undefined

export interface InputFile {
  path: string
  extension: string
  srcPath?: string
  getContents: () => Promise<string> | string
}

export interface OutputFile {
  path: string
  srcPath?: string
  extension?: string
  contents?: string
  declaration?: boolean
  raw?: boolean
  skip?: boolean
}

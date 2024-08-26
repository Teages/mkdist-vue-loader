import type { MkdistOptions } from 'mkdist'

export type Loader = Exclude<NonNullable<MkdistOptions['loaders']>[number], string>

export type LoaderResult = Awaited<ReturnType<Loader>>

export type InputFile = Parameters<Loader>[0]

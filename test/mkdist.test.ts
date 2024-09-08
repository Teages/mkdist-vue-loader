import { readFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { vueLoader } from '../src'

describe('mkdist', () => {
  let mkdist: typeof import('mkdist').mkdist

  beforeAll(async () => {
    mkdist = (await import('mkdist')).mkdist
  })

  it('mkdist', async () => {
    const rootDir = resolve(__dirname, 'fixtures/mkdist')
    const { writtenFiles } = await mkdist({ rootDir, loaders: ['js', 'postcss', 'sass', vueLoader] })
    expect(writtenFiles.sort()).toEqual(
      [
        'dist/README.md',
        'dist/demo.css',
        'dist/foo.mjs',
        'dist/foo.d.ts', // manual
        'dist/index.mjs',
        'dist/types.d.ts',
        'dist/star/index.mjs',
        'dist/star/other.mjs',
        'dist/components/blank.vue',
        'dist/components/js.vue',
        'dist/components/script-setup-ts.vue',
        'dist/components/ts.vue',
        'dist/components/jsx.mjs',
        'dist/components/tsx.mjs',
        'dist/bar/index.mjs',
        'dist/bar/esm.mjs',
        'dist/ts/test1.mjs',
        'dist/ts/test2.mjs',
        'dist/nested.css',
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )
  })

  it('mkdist (custom glob pattern)', async () => {
    const rootDir = resolve(__dirname, 'fixtures/mkdist')
    const { writtenFiles } = await mkdist({
      rootDir,
      pattern: 'components/**',
      loaders: ['js', 'postcss', 'sass', vueLoader],
    })
    expect(writtenFiles.sort()).toEqual(
      [
        'dist/components/blank.vue',
        'dist/components/js.vue',
        'dist/components/script-setup-ts.vue',
        'dist/components/ts.vue',
        'dist/components/jsx.mjs',
        'dist/components/tsx.mjs',
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )
  })

  it('mkdist (multiple glob patterns)', async () => {
    const rootDir = resolve(__dirname, 'fixtures/mkdist')
    const { writtenFiles } = await mkdist({
      rootDir,
      pattern: ['components/**', '!components/js.vue'],
      loaders: ['js', 'postcss', 'sass', vueLoader],
    })
    expect(writtenFiles.sort()).toEqual(
      [
        'dist/components/blank.vue',
        'dist/components/script-setup-ts.vue',
        'dist/components/ts.vue',
        'dist/components/jsx.mjs',
        'dist/components/tsx.mjs',
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )
  })

  it('mkdist (emit types)', async () => {
    const rootDir = resolve(__dirname, 'fixtures/mkdist')
    const { writtenFiles } = await mkdist({
      rootDir,
      declaration: true,
      addRelativeDeclarationExtensions: true,
      loaders: ['js', 'postcss', 'sass', vueLoader],
    })
    expect(writtenFiles.sort()).toEqual(
      [
        'dist/README.md',
        'dist/demo.css',
        'dist/foo.mjs',
        'dist/foo.d.ts',
        'dist/index.mjs',
        'dist/index.d.ts',
        'dist/star/index.mjs',
        'dist/star/index.d.ts',
        'dist/star/other.mjs',
        'dist/star/other.d.ts',
        'dist/types.d.ts',
        'dist/components/blank.vue',
        'dist/components/js.vue',
        'dist/components/js.vue.d.ts',
        'dist/components/script-setup-ts.vue',
        'dist/components/script-setup-ts.vue.d.ts',
        'dist/components/ts.vue',
        'dist/components/ts.vue.d.ts',
        'dist/components/jsx.mjs',
        'dist/components/tsx.mjs',
        'dist/components/jsx.d.ts',
        'dist/components/tsx.d.ts',
        'dist/bar/index.mjs',
        'dist/bar/index.d.ts',
        'dist/bar/esm.mjs',
        'dist/bar/esm.d.mts',
        'dist/ts/test1.mjs',
        'dist/ts/test2.mjs',
        'dist/ts/test1.d.mts',
        'dist/ts/test2.d.cts',
        'dist/nested.css',
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )

    expect(await readFile(resolve(rootDir, 'dist/foo.d.ts'), 'utf8')).toMatch(
      'manual declaration',
    )

    expect(await readFile(resolve(rootDir, 'dist/star/index.d.ts'), 'utf8'))
      .toMatchInlineSnapshot(`
          "export * from './other.js';
          export type { Other } from './other.js';
          "
        `)
    expect(
      await readFile(resolve(rootDir, 'dist/bar/esm.d.mts'), 'utf8'),
    ).toMatch('declare')
    expect(
      await readFile(resolve(rootDir, 'dist/components/ts.vue.d.ts'), 'utf8'),
    ).toMatchInlineSnapshot(`
          "declare const _default: import("vue").DefineComponent<{}, {}, {
              test: string;
              str: "test";
          }, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<{}> & Readonly<{}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
          export default _default;
          "
        `)
  }, 50_000)

  describe('mkdist (sass compilation)', () => {
    const rootDir = resolve(__dirname, 'fixtures/mkdist')
    let writtenFiles: string[]
    beforeEach(async () => {
      const results = await mkdist({ rootDir })
      writtenFiles = results.writtenFiles
    })

    it('resolves local imports and excludes partials ', async () => {
      const css = await readFile(resolve(rootDir, 'dist/demo.css'), 'utf8')

      expect(writtenFiles).not.toContain('dist/_base.css')
      expect(css).toMatch('color: green')
    })

    it('resolves node_modules imports', async () => {
      const css = await readFile(resolve(rootDir, 'dist/demo.css'), 'utf8')
      expect(css).toMatch('box-sizing: border-box;')
    })

    it('compiles sass blocks in vue SFC', async () => {
      const vue = await readFile(
        resolve(rootDir, 'dist/components/js.vue'),
        'utf8',
      )

      expect(vue).toMatch('color: green;\n  background-color: red;')
    })
  })

  it('mkdist (only jsLoader and vueLoader)', async () => {
    const rootDir = resolve(__dirname, 'fixtures/mkdist')
    const { writtenFiles } = await mkdist({
      rootDir,
      loaders: ['js', vueLoader],
    })
    expect(writtenFiles.sort()).toEqual(
      [
        'dist/README.md',
        'dist/demo.scss',
        'dist/_base.scss',
        'dist/foo.mjs',
        'dist/foo.d.ts', // manual
        'dist/index.mjs',
        'dist/types.d.ts',
        'dist/star/index.mjs',
        'dist/star/other.mjs',
        'dist/components/blank.vue',
        'dist/components/js.vue',
        'dist/components/script-setup-ts.vue',
        'dist/components/ts.vue',
        'dist/components/jsx.mjs',
        'dist/components/tsx.mjs',
        'dist/bar/index.mjs',
        'dist/bar/esm.mjs',
        'dist/ts/test1.mjs',
        'dist/ts/test2.mjs',
        'dist/nested.css',
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )
  })
})

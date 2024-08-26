import { resolve } from 'pathe'
import { describe, expect, it } from 'vitest'
import { vueLoader } from '../src'

describe('@teages/mkdist-vue-loader', () => {
  it('mkdist (emit types)', async () => {
    const rootDir = resolve(__dirname, 'fixture')
    const { mkdist } = await import('mkdist')

    const { writtenFiles } = await mkdist({
      rootDir,
      declaration: true,
      addRelativeDeclarationExtensions: true,
      loaders: ['js', 'postcss', 'sass', vueLoader],
    })
    expect(writtenFiles.sort()).toEqual(
      [
        'dist/index.mjs',
        'dist/index.d.ts',
        'dist/components/blank.vue',
        'dist/components/js.vue',
        'dist/components/js.vue.d.ts',
        'dist/components/script-setup-ts.vue',
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
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )
  })
})

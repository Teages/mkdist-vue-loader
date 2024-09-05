import { readFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import {
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest'
import { vueLoader } from '../src'

describe('vue-loader', () => {
  let mkdist: typeof import('mkdist').mkdist

  beforeAll(async () => {
    mkdist = (await import('mkdist')).mkdist
  })

  it('vue-loader', async () => {
    const rootDir = resolve(__dirname, 'fixtures/vue-loader')
    const { writtenFiles } = await mkdist({ rootDir, loaders: ['js', 'postcss', 'sass', vueLoader], declaration: true })

    expect(writtenFiles.sort()).toEqual(
      [
        'dist/js-script-setup.vue',
        'dist/js-script-setup.vue.d.ts',
        'dist/js-script.vue',
        'dist/js-script.vue.d.ts',
        'dist/mixin.vue',
        'dist/mixin.vue.d.ts',
        'dist/ts-script-setup.vue',
        'dist/ts-script-setup.vue.d.ts',
        'dist/ts-script.vue',
        'dist/ts-script.vue.d.ts',
      ]
        .map(f => resolve(rootDir, f))
        .sort(),
    )

    const contents = await Promise.all(
      writtenFiles.map(filepath => readFile(filepath, 'utf-8')),
    )

    contents.forEach((file) => {
      expect(file).toMatchSnapshot()
    })
  })
})

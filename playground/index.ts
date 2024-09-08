/* eslint-disable no-console */
import { vueLoader } from '@teages/mkdist-vue-loader'
import { mkdist } from 'mkdist'

const { writtenFiles } = await mkdist({
  srcDir: './fixture',
  distDir: 'dist',
  loaders: ['js', 'postcss', 'sass', vueLoader],
  declaration: true,
  cleanDist: true,
})

for (const path of writtenFiles) {
  console.log(path)
}

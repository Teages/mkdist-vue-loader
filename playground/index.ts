/* eslint-disable no-console */
import { mkdist } from 'mkdist'
import { vueLoader } from '@teages/mkdist-vue-loader'

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

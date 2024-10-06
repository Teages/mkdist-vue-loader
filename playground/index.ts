/* eslint-disable no-console */
import { vueLoader } from '@teages/mkdist-vue-loader'
import { mkdist } from 'mkdist'

mkdist({
  srcDir: './fixture',
  distDir: 'dist',
  loaders: ['js', 'postcss', 'sass', vueLoader],
  declaration: true,
  cleanDist: true,
}).then(({ writtenFiles }) => {
  console.table(writtenFiles)
})

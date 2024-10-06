<script lang="ts">
import type { Data } from './type'
import { computed } from 'vue'

export interface PropsData {
  name: string
  data: Data
}
</script>

<script setup lang="ts">
defineOptions({ name: 'Play' })
const props = defineProps<PropsData>()

const msg = computed<string>(() => `Hello ${props.name}!`)
</script>

<template>
  <div>{{ msg }}</div>
</template>

<style lang="scss" scoped>
@mixin test {
  background-color: #fff;
}

div {
  color: red;
  @include test();

  .test {
    color: blue;
    @include test();
  }
}
</style>

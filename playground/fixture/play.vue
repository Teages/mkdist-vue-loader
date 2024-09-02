<script setup lang="ts">
import { computed } from 'vue'
import type { Data } from './type'

defineOptions({ name: 'Play' })
const props = defineProps<{ name: string, data: Data }>()

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

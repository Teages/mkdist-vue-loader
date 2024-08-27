<script>
import test from '..'

const str = 'test'

export default {
  data: () => ({
    test: test(),
    str,
  }),
}
</script>

<template>
  <div>{{ test }}</div>
</template>

<style lang="scss" scoped>
@use "../base" as base;

$bg-color: red;

.test {
  color: base.$color;
  background-color: $bg-color;
}
</style>

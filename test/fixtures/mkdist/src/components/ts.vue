<script lang="ts">
import test from '..'

// eslint-disable-next-line ts/prefer-as-const
const str: 'test' = 'test'

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

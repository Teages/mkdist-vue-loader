<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  msg: string
}>()

const str = ref<string | number>('hello')
</script>

<template>
  <div>{{ str }}</div>
</template>

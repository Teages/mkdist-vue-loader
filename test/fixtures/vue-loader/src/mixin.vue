<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({ name: 'TsScriptSetup' })
</script>

<script setup lang="ts">
defineProps<{
  title: string
  message?: string
}>()

const value = defineModel<string>({ required: true })

const count = ref(0)
function increment() {
  count.value++
}

const localValue = computed({
  get: () => value.value,
  set: val => value.value = val,
})
</script>

<template>
  <div>
    <h1 :class="$style.title">
      {{ title }}
    </h1>
    <p>{{ message }}</p>
    <button @click="increment">
      Increment
    </button>
    <p>Count: {{ count }}</p>

    <slot name="custom-content" />

    <input v-model="localValue">
    <p>Local Value: {{ localValue }}</p>
  </div>
</template>

<style module>
.title {
  color: blue;
}
</style>

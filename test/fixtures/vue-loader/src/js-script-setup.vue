<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'JsScriptSetup' })

defineProps({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: 'Hello, Vue!',
  },
})

const value = defineModel({ type: String, required: true })

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

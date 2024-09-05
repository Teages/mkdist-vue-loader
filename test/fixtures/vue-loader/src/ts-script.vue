<script lang="ts">
import { computed, defineComponent, ref } from 'vue'

function useCounter() {
  const count = ref(0)
  const increment = () => {
    count.value++
  }
  return { count, increment }
}

export default defineComponent({
  name: 'TsScript',

  props: {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: 'Hello, Vue!',
    },
    modelValue: {
      type: String,
      default: '',
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const { count, increment } = useCounter()

    const localValue = computed({
      get: () => props.modelValue,
      set: value => emit('update:modelValue', value),
    })

    return {
      count,
      increment,
      localValue,
    }
  },
})
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
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

<style scoped>
h1 {
  color: blue;
}
</style>

<script setup>
import { Icon } from '@iconify/vue'

defineProps({
  icon: { type: String, required: true },
  size: { type: [String, Number], default: 22 },
  color: { type: String, default: 'currentColor' },
})
</script>

<template>
  <Icon :icon="icon" :width="size" :height="size" :color="color" class="app-icon" />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>

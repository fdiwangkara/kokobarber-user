<script setup>
defineProps({
  status: { type: String, required: true },
})

const labels = {
  upcoming: 'Akan Datang',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
}
</script>

<template>
  <span class="badge" :class="`badge-${status}`">{{ labels[status] ?? status }}</span>
</template>

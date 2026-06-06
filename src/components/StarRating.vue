<script setup>
const model = defineModel({ type: Number, default: 0 })

const props = defineProps({
  readonly: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
})

function setRating(value) {
  if (!props.readonly) model.value = value
}
</script>

<template>
  <div class="stars" :class="`stars--${size}`">
    <button
      v-for="star in 5"
      :key="star"
      type="button"
      class="star"
      :class="{ filled: star <= model, readonly: props.readonly }"
      :disabled="props.readonly"
      :aria-label="`${star} bintang`"
      @click="setRating(star)"
    >
      ★
    </button>
  </div>
</template>

<style scoped>
.stars {
  display: flex;
  gap: 0.1rem;
}

.star {
  color: #ddd;
  font-size: 1.5rem;
  line-height: 1;
  transition: color 0.15s, transform 0.15s;
  padding: 0;
}

.stars--sm .star {
  font-size: 1rem;
}

.stars--lg .star {
  font-size: 2rem;
}

.star.filled {
  color: var(--accent);
}

.star:not(.readonly):hover {
  transform: scale(1.15);
  color: var(--accent-light);
}
</style>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/database'
import { getCancelReasonLabel } from '../utils/cancellation'
import { formatDate, formatPrice, formatTimeSlot } from '../utils/timeSlots'
import { useAlertStore } from '../stores/alert'
import { canCancelBooking } from '../utils/cancellation'
import StatusBadge from './StatusBadge.vue'
import AppIcon from './AppIcon.vue'
import StarRating from './StarRating.vue'

const props = defineProps({
  booking: { type: Object, required: true },
})

const emit = defineEmits(['cancel'])

const router = useRouter()
const alert = useAlertStore()

const barber = computed(() => db.getBarberById(props.booking.barberId))
const service = computed(() => db.getServiceById(props.booking.serviceId))
const cancelAllowed = computed(() => canCancelBooking(props.booking))

function goToRate() {
  router.push({ name: 'rate', params: { id: props.booking.id } })
}

function requestCancel() {
  if (!cancelAllowed.value.allowed) {
    alert.warning(cancelAllowed.value.reason)
    return
  }
  emit('cancel', props.booking.id)
}

function formatCancelledAt(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
</script>

<template>
  <article class="booking-card card">
    <div class="booking-header">
      <StatusBadge :status="booking.status" />
      <span class="booking-date">{{ formatDate(booking.date) }}</span>
    </div>

    <div class="booking-body">
      <div class="booking-avatar">
        <img :src="barber?.avatar" :alt="barber?.name" />
      </div>
      <div class="booking-info">
        <h3 class="booking-barber">{{ barber?.name }}</h3>
        <p class="booking-service">
          <AppIcon :icon="service?.icon ?? 'mdi:scissors-cutting'" :size="16" />
          {{ service?.name }}
        </p>
        <p class="booking-time">
          <AppIcon icon="mdi:clock-outline" :size="16" />
          {{ formatTimeSlot(booking.timeSlot) }}
        </p>
      </div>
      <div class="booking-price">
        <span v-if="booking.discountApplied" class="price-original">
          {{ formatPrice(booking.originalPrice) }}
        </span>
        <span class="price-final">{{ formatPrice(booking.finalPrice) }}</span>
      </div>
    </div>

    <div v-if="booking.status === 'cancelled'" class="cancel-info">
      <AppIcon icon="mdi:information-outline" :size="16" />
      <div>
        <p v-if="booking.cancelReason">
          Alasan: {{ getCancelReasonLabel(booking.cancelReason) }}
        </p>
        <p v-if="booking.cancelNote" class="cancel-note">"{{ booking.cancelNote }}"</p>
        <p v-if="booking.cancelledAt" class="cancel-meta">
          Dibatalkan {{ formatCancelledAt(booking.cancelledAt) }}
        </p>
        <p v-if="booking.refundAmount != null" class="refund-line">
          Refund: {{ formatPrice(booking.refundAmount) }}
          <span v-if="booking.refundPercent">({{ booking.refundPercent }}%)</span>
        </p>
      </div>
    </div>

    <div v-if="booking.rated" class="booking-rating">
      <span>Rating Anda:</span>
      <StarRating :model-value="booking.rating" readonly size="sm" />
    </div>

    <div class="booking-actions">
      <button
        v-if="booking.status === 'completed' && !booking.rated"
        class="btn btn-accent btn-sm"
        @click="goToRate"
      >
        <AppIcon icon="mdi:star-outline" :size="16" />
        Beri Rating
      </button>
      <button
        v-if="booking.status === 'upcoming'"
        class="btn btn-outline btn-sm"
        @click="requestCancel"
      >
        <AppIcon icon="mdi:calendar-remove" :size="16" />
        Batalkan
      </button>
      <button
        v-if="booking.status === 'ongoing'"
        class="btn btn-ghost btn-sm"
        disabled
      >
        <AppIcon icon="mdi:progress-clock" :size="16" />
        Sedang Berlangsung
      </button>
    </div>
  </article>
</template>

<style scoped>
.booking-card {
  margin-bottom: 0.75rem;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.booking-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.booking-body {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.booking-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  background: var(--bg);
}

.booking-info {
  flex: 1;
  min-width: 0;
}

.booking-barber {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary);
}

.booking-service,
.booking-time {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.booking-price {
  text-align: right;
}

.price-original {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.price-final {
  font-weight: 700;
  color: var(--accent-dark);
}

.cancel-info {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.65rem;
  background: rgba(155, 34, 38, 0.06);
  border-radius: var(--radius);
  font-size: 0.8rem;
  color: var(--danger);
}

.cancel-note {
  font-style: italic;
  opacity: 0.85;
}

.cancel-meta,
.refund-line {
  margin-top: 0.2rem;
  color: var(--text-muted);
}

.booking-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.booking-actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}

.booking-actions .btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}
</style>

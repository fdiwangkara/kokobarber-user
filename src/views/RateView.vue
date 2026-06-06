<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '../db/database'
import { useBookingStore } from '../stores/booking'
import { useAuthStore } from '../stores/auth'
import { useAlertStore } from '../stores/alert'
import { formatDate, formatTimeSlot } from '../utils/timeSlots'
import StarRating from '../components/StarRating.vue'
import AppIcon from '../components/AppIcon.vue'
import AppAlert from '../components/AppAlert.vue'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()
const auth = useAuthStore()
const alert = useAlertStore()

const rating = ref(0)
const review = ref('')
const error = ref('')
const submitted = ref(false)

const booking = computed(() => db.getBookingById(route.params.id))
const barber = computed(() =>
  booking.value ? db.getBarberById(booking.value.barberId) : null
)
const service = computed(() =>
  booking.value ? db.getServiceById(booking.value.serviceId) : null
)

onMounted(() => {
  if (!booking.value || booking.value.userId !== auth.user?.id) {
    alert.error('Booking tidak ditemukan.')
    router.replace('/history')
    return
  }
  if (booking.value.status !== 'completed') {
    alert.warning('Rating hanya tersedia untuk booking yang sudah selesai.')
    router.replace('/history')
    return
  }
  if (booking.value.rated) {
    rating.value = booking.value.rating
    review.value = booking.value.review ?? ''
    submitted.value = true
  }
})

function submitRating() {
  error.value = ''
  if (rating.value < 1) {
    error.value = 'Pilih rating minimal 1 bintang'
    return
  }
  try {
    bookingStore.rateBooking(booking.value.id, rating.value, review.value)
    submitted.value = true
    alert.success('Terima kasih! Rating Anda telah dikirim.')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Rating Barber</h1>
    <p class="page-subtitle">Bagikan pengalaman Anda</p>

    <div v-if="barber" class="rate-card card">
      <img :src="barber.avatar" :alt="barber.name" class="barber-avatar" />
      <h2>{{ barber.name }}</h2>
      <p class="booking-detail">
        {{ service?.name }} · {{ formatDate(booking?.date) }} ·
        {{ formatTimeSlot(booking?.timeSlot) }}
      </p>

      <div class="rating-section">
        <label class="form-label">Beri Rating</label>
        <StarRating v-model="rating" size="lg" :readonly="submitted" />
      </div>

      <div class="form-group">
        <label class="form-label" for="review">Ulasan (opsional)</label>
        <textarea
          id="review"
          v-model="review"
          class="form-input review-input"
          rows="4"
          placeholder="Ceritakan pengalaman Anda..."
          :readonly="submitted"
        />
      </div>

      <AppAlert v-if="error" type="error" :message="error" />

      <template v-if="!submitted">
        <button class="btn btn-accent submit-btn" :disabled="rating < 1" @click="submitRating">
          <AppIcon icon="mdi:send" :size="18" />
          Kirim Rating
        </button>
      </template>
      <template v-else>
        <AppAlert type="success" title="Terima kasih!" message="Ulasan Anda membantu kami meningkatkan layanan." />
        <button class="btn btn-primary action-btn" @click="router.push('/history')">
          <AppIcon icon="mdi:arrow-left" :size="18" />
          Kembali ke Riwayat
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.rate-card {
  text-align: center;
  padding: 1.5rem;
}

.barber-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 0.75rem;
  border: 3px solid var(--accent);
}

.rate-card h2 {
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.booking-detail {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.rating-section {
  margin-bottom: 1rem;
}

.rating-section :deep(.stars) {
  justify-content: center;
  margin-top: 0.5rem;
}

.review-input {
  resize: vertical;
  min-height: 100px;
}

.submit-btn,
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
</style>

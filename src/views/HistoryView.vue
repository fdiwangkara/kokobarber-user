<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBookingStore } from '../stores/booking'
import { useAlertStore } from '../stores/alert'
import { formatPrice } from '../utils/timeSlots'
import BookingCard from '../components/BookingCard.vue'
import CancelBookingModal from '../components/CancelBookingModal.vue'
import AppAlert from '../components/AppAlert.vue'
import AppIcon from '../components/AppIcon.vue'

const bookingStore = useBookingStore()
const alert = useAlertStore()
const filter = ref('all')
const cancelBookingId = ref(null)
const showPolicyAlert = ref(true)

const bookings = ref([])

onMounted(() => refresh())

function refresh() {
  bookings.value = bookingStore.getUserBookings()
}

const filtered = computed(() => {
  if (filter.value === 'all') return bookings.value
  return bookings.value.filter((b) => b.status === filter.value)
})

const counts = computed(() => ({
  all: bookings.value.length,
  upcoming: bookings.value.filter((b) => b.status === 'upcoming').length,
  ongoing: bookings.value.filter((b) => b.status === 'ongoing').length,
  completed: bookings.value.filter((b) => b.status === 'completed').length,
  cancelled: bookings.value.filter((b) => b.status === 'cancelled').length,
}))

const filters = [
  { key: 'all', label: 'Semua', icon: 'mdi:view-list' },
  { key: 'upcoming', label: 'Akan Datang', icon: 'mdi:calendar-clock' },
  { key: 'ongoing', label: 'Berlangsung', icon: 'mdi:progress-clock' },
  { key: 'completed', label: 'Selesai', icon: 'mdi:check-circle-outline' },
  { key: 'cancelled', label: 'Dibatalkan', icon: 'mdi:calendar-remove' },
]

function openCancelModal(id) {
  cancelBookingId.value = id
}

function closeCancelModal() {
  cancelBookingId.value = null
}

function handleCancelled(payload) {
  bookingStore.cancelBooking(payload.bookingId, payload)
  closeCancelModal()
  refresh()
  if (payload.refundAmount > 0) {
    alert.success(
      `Booking dibatalkan. Refund ${formatPrice(payload.refundAmount)} akan diproses dalam 1x24 jam.`
    )
  } else {
    alert.warning('Booking dibatalkan. Tidak ada refund sesuai kebijakan.')
  }
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Riwayat Transaksi</h1>
    <p class="page-subtitle">Semua booking dan status pembayaran Anda</p>

    <AppAlert
      v-if="showPolicyAlert"
      type="info"
      title="Kebijakan Pembatalan"
      dismissible
      @dismiss="showPolicyAlert = false"
    >
      Booking dapat dibatalkan minimal 2 jam sebelum jadwal. Refund 100% (&gt;24 jam) atau 50% (2–24 jam).
    </AppAlert>

    <div class="filter-tabs">
      <button
        v-for="f in filters"
        :key="f.key"
        class="filter-tab"
        :class="{ active: filter === f.key }"
        @click="filter = f.key"
      >
        <AppIcon :icon="f.icon" :size="16" />
        {{ f.label }}
        <span v-if="counts[f.key]" class="count">{{ counts[f.key] }}</span>
      </button>
    </div>

    <div v-if="filtered.length" class="booking-list">
      <BookingCard
        v-for="booking in filtered"
        :key="booking.id"
        :booking="booking"
        @cancel="openCancelModal"
      />
    </div>

    <div v-else class="empty-state card">
      <AppIcon icon="mdi:clipboard-text-off-outline" :size="48" class="empty-icon" />
      <p>Belum ada transaksi{{ filter !== 'all' ? ' dengan status ini' : '' }}</p>
      <router-link to="/book" class="btn btn-primary empty-cta">
        <AppIcon icon="mdi:calendar-plus" :size="18" />
        Booking Sekarang
      </router-link>
    </div>

    <CancelBookingModal
      :booking-id="cancelBookingId"
      @close="closeCancelModal"
      @cancelled="handleCancelled"
    />
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  scroll-snap-type: x mandatory;
}

.filter-tab {
  flex-shrink: 0;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  color: var(--text-muted);
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.filter-tab.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  font-size: 0.7rem;
}

.filter-tab:not(.active) .count {
  background: var(--border);
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.empty-cta {
  margin-top: 1rem;
  max-width: 220px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
</style>

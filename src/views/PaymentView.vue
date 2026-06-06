<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/database'
import { useBookingStore } from '../stores/booking'
import { useAlertStore } from '../stores/alert'
import { formatDate, formatPrice, formatTimeSlot } from '../utils/timeSlots'
import AppIcon from '../components/AppIcon.vue'
import AppAlert from '../components/AppAlert.vue'

const router = useRouter()
const bookingStore = useBookingStore()
const alert = useAlertStore()

const paymentMethod = ref('mock')
const processing = ref(false)
const success = ref(false)
const createdBooking = ref(null)
const orderSnapshot = ref(null)

const draft = computed(() => bookingStore.draft)
const pricePreview = computed(() => bookingStore.getPricePreview())

const barber = computed(() => {
  const id = orderSnapshot.value?.barberId ?? draft.value.barberId
  return id ? db.getBarberById(id) : null
})
const service = computed(() => {
  const id = orderSnapshot.value?.serviceId ?? draft.value.serviceId
  return id ? db.getServiceById(id) : null
})
const displayDate = computed(() => orderSnapshot.value?.date ?? draft.value.date)
const displayTime = computed(() => orderSnapshot.value?.timeSlot ?? draft.value.timeSlot)

const isValid = computed(
  () => draft.value.barberId && draft.value.serviceId && draft.value.date && draft.value.timeSlot
)

onMounted(() => {
  if (!isValid.value) {
    alert.warning('Lengkapi data booking terlebih dahulu.')
    router.replace('/book')
    return
  }
  orderSnapshot.value = { ...draft.value }
})

async function processPayment() {
  processing.value = true
  await new Promise((r) => setTimeout(r, 1500))
  try {
    createdBooking.value = bookingStore.createBooking(paymentMethod.value)
    success.value = true
    alert.success('Pembayaran berhasil! Booking Anda telah dikonfirmasi.')
  } catch (e) {
    alert.error(e.message)
  } finally {
    processing.value = false
  }
}

function goToHistory() {
  router.push('/history')
}

function bookAgain() {
  router.push('/book')
}
</script>

<template>
  <div class="page">
    <template v-if="!success">
      <h1 class="page-title">Pembayaran</h1>
      <p class="page-subtitle">Mock payment — langsung berhasil</p>

      <AppAlert type="info" message="Ini simulasi pembayaran. Tidak ada transaksi nyata yang diproses." />

      <div class="order-summary card">
        <h3>Detail Pesanan</h3>
        <div class="summary-row">
          <span>Barber</span>
          <span>{{ barber?.name }}</span>
        </div>
        <div class="summary-row">
          <span>Layanan</span>
          <span>{{ service?.name }}</span>
        </div>
        <div class="summary-row">
          <span>Tanggal</span>
          <span>{{ displayDate ? formatDate(displayDate) : '-' }}</span>
        </div>
        <div class="summary-row">
          <span>Waktu</span>
          <span>{{ displayTime ? formatTimeSlot(displayTime) : '-' }}</span>
        </div>
        <div class="summary-row total">
          <span>Total Bayar</span>
          <span>
            <s v-if="pricePreview?.discountApplied" class="strike">
              {{ formatPrice(pricePreview.originalPrice) }}
            </s>
            {{ formatPrice(pricePreview?.finalPrice ?? 0) }}
          </span>
        </div>
      </div>

      <div class="payment-methods card">
        <h3>Metode Pembayaran</h3>
        <label class="payment-option" :class="{ active: paymentMethod === 'mock' }">
          <input v-model="paymentMethod" type="radio" value="mock" />
          <AppIcon icon="mdi:credit-card-outline" :size="28" color="var(--primary)" />
          <div>
            <strong>Mock Payment</strong>
            <p>Pembayaran simulasi — otomatis sukses</p>
          </div>
        </label>
        <label class="payment-option" :class="{ active: paymentMethod === 'ewallet' }">
          <input v-model="paymentMethod" type="radio" value="ewallet" />
          <AppIcon icon="mdi:cellphone" :size="28" color="var(--primary)" />
          <div>
            <strong>E-Wallet (Mock)</strong>
            <p>GoPay, OVO, DANA — simulasi</p>
          </div>
        </label>
      </div>

      <button class="btn btn-primary pay-btn" :disabled="processing" @click="processPayment">
        <AppIcon v-if="processing" icon="mdi:loading" :size="18" class="spin" />
        <AppIcon v-else icon="mdi:cash-check" :size="18" />
        {{ processing ? 'Memproses pembayaran...' : `Bayar ${formatPrice(pricePreview?.finalPrice ?? 0)}` }}
      </button>
    </template>

    <template v-else>
      <div class="success-screen">
        <AppIcon icon="mdi:check-circle" :size="72" color="var(--success)" class="success-icon" />
        <h1 class="page-title">Pembayaran Berhasil!</h1>
        <p class="page-subtitle">Booking Anda telah dikonfirmasi</p>

        <div class="card success-card">
          <p class="booking-id">ID: {{ createdBooking?.id?.slice(-8).toUpperCase() }}</p>
          <p>{{ barber?.name }} · {{ service?.name }}</p>
          <p>{{ displayDate ? formatDate(displayDate) : '-' }} · {{ displayTime ? formatTimeSlot(displayTime) : '-' }}</p>
        </div>

        <button class="btn btn-primary action-btn" @click="goToHistory">
          <AppIcon icon="mdi:clipboard-text-outline" :size="18" />
          Lihat Riwayat
        </button>
        <button class="btn btn-outline action-btn" @click="bookAgain">
          <AppIcon icon="mdi:calendar-plus" :size="18" />
          Booking Lagi
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.order-summary h3,
.payment-methods h3 {
  color: var(--primary);
  margin-bottom: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 0.4rem 0;
  color: var(--text-muted);
}

.summary-row.total {
  font-weight: 700;
  color: var(--primary);
  border-top: 1px solid var(--border);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
}

.strike {
  color: var(--text-muted);
  font-weight: 400;
  margin-right: 0.35rem;
}

.payment-methods {
  margin: 1rem 0;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.payment-option.active {
  border-color: var(--accent);
  background: rgba(184, 139, 0, 0.05);
}

.payment-option input {
  accent-color: var(--primary);
}

.payment-option strong {
  display: block;
  color: var(--primary);
  font-size: 0.9rem;
}

.payment-option p {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pay-btn {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-screen {
  text-align: center;
  padding-top: 2rem;
}

.success-icon {
  margin-bottom: 1rem;
}

.success-card {
  margin: 1.5rem 0;
  text-align: left;
}

.booking-id {
  font-weight: 700;
  color: var(--accent-dark);
  margin-bottom: 0.5rem;
}

.success-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0.25rem 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
</style>

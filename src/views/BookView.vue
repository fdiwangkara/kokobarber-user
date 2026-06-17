<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/database'
import { useBookingStore } from '../stores/booking'
import { useAuthStore } from '../stores/auth'
import {
  generateTimeSlots,
  formatTimeSlot,
  formatPrice,
  getMinBookingDate,
  isSlotInPast,
} from '../utils/timeSlots'
import AppIcon from '../components/AppIcon.vue'
import AppAlert from '../components/AppAlert.vue'

const router = useRouter()
const bookingStore = useBookingStore()
const auth = useAuthStore()

const step = ref(1)
const barbers = computed(() => db.getBarbers())
const services = computed(() => db.getServices())
const timeSlots = generateTimeSlots()
const minDate = getMinBookingDate()

const draft = computed(() => bookingStore.draft)
const pricePreview = computed(() => bookingStore.getPricePreview())

const bookedSlots = computed(() => {
  if (!draft.value.barberId || !draft.value.date) return []
  return bookingStore.getBookedSlots(draft.value.barberId, draft.value.date)
})

const selectedBarber = computed(() =>
  draft.value.barberId ? db.getBarberById(draft.value.barberId) : null
)
const selectedService = computed(() =>
  draft.value.serviceId ? db.getServiceById(draft.value.serviceId) : null
)

function selectBarber(id) {
  bookingStore.setDraftField('barberId', id)
  step.value = 2
}

function selectService(id) {
  bookingStore.setDraftField('serviceId', id)
  step.value = 3
}

function selectDate(e) {
  bookingStore.setDraftField('date', e.target.value)
  bookingStore.setDraftField('timeSlot', null)
}

function selectTime(slot) {
  bookingStore.setDraftField('timeSlot', slot)
}

function isSlotDisabled(slot) {
  if (!draft.value.date) return true
  if (isSlotInPast(draft.value.date, slot)) return true
  return bookedSlots.value.includes(slot)
}

function canProceedToPayment() {
  return draft.value.barberId && draft.value.serviceId && draft.value.date && draft.value.timeSlot
}

function goToPayment() {
  if (!canProceedToPayment()) return
  router.push('/payment')
}

function goBack() {
  if (step.value > 1) step.value--
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Booking</h1>
    <p class="page-subtitle">Pilih barber, layanan, dan jadwal Anda</p>

    <div class="stepper">
      <div class="stepper-track">
        <!-- Step 1 -->
        <div class="stepper-item" :class="{ active: step >= 1, current: step === 1 }">
          <div class="stepper-circle">
            <AppIcon v-if="step > 1" icon="mdi:check" :size="16" />
            <span v-else>1</span>
          </div>
          <div class="stepper-label">
            <span class="stepper-title">Barber</span>
            <span class="stepper-desc">Pilih barber favorit</span>
          </div>
        </div>

        <!-- Line 1-2 -->
        <div class="stepper-line" :class="{ active: step >= 2 }"></div>

        <!-- Step 2 -->
        <div class="stepper-item" :class="{ active: step >= 2, current: step === 2 }">
          <div class="stepper-circle">
            <AppIcon v-if="step > 2" icon="mdi:check" :size="16" />
            <span v-else>2</span>
          </div>
          <div class="stepper-label">
            <span class="stepper-title">Layanan</span>
            <span class="stepper-desc">Pilih jenis potong</span>
          </div>
        </div>

        <!-- Line 2-3 -->
        <div class="stepper-line" :class="{ active: step >= 3 }"></div>

        <!-- Step 3 -->
        <div class="stepper-item" :class="{ active: step >= 3, current: step === 3 }">
          <div class="stepper-circle">
            <span>3</span>
          </div>
          <div class="stepper-label">
            <span class="stepper-title">Jadwal</span>
            <span class="stepper-desc">Tentukan waktu</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 1: Barber -->
    <section v-show="step === 1">
      <h2 class="section-title">Pilih Barber</h2>
      <div class="barber-grid">
        <button
          v-for="barber in barbers"
          :key="barber.id"
          class="barber-option card"
          :class="{ selected: draft.barberId === barber.id }"
          @click="selectBarber(barber.id)"
        >
          <img :src="barber.avatar" :alt="barber.name" />
          <h3>{{ barber.name }}</h3>
          <p>{{ barber.specialty }}</p>
          <span class="rating">
            <AppIcon icon="mdi:star" :size="14" color="var(--accent)" />
            {{ barber.rating }} ({{ barber.reviewCount }})
          </span>
        </button>
      </div>
    </section>

    <!-- Step 2: Service -->
    <section v-show="step === 2">
      <button class="back-link" @click="goBack">
        <AppIcon icon="mdi:arrow-left" :size="16" /> Kembali
      </button>
      <h2 class="section-title">Pilih Layanan</h2>
      <div class="service-grid">
        <button
          v-for="service in services"
          :key="service.id"
          class="service-option card"
          :class="{ selected: draft.serviceId === service.id }"
          @click="selectService(service.id)"
        >
          <AppIcon :icon="service.icon" :size="32" class="icon" color="var(--primary)" />
          <div>
            <h3>{{ service.name }}</h3>
            <p>{{ service.description }}</p>
            <span class="price">{{ formatPrice(service.price) }} · {{ service.duration }} menit</span>
          </div>
        </button>
      </div>
    </section>

    <!-- Step 3: Date & Time -->
    <section v-show="step === 3">
      <button class="back-link" @click="goBack">
        <AppIcon icon="mdi:arrow-left" :size="16" /> Kembali
      </button>
      <h2 class="section-title">Pilih Tanggal & Waktu</h2>

      <div class="form-group">
        <label class="form-label" for="date">Tanggal</label>
        <input
          id="date"
          type="date"
          class="form-input"
          :min="minDate"
          :value="draft.date"
          @change="selectDate"
        />
      </div>

      <div v-if="draft.date" class="time-slots">
        <button
          v-for="slot in timeSlots"
          :key="slot"
          class="time-slot"
          :class="{
            selected: draft.timeSlot === slot,
            disabled: isSlotDisabled(slot),
          }"
          :disabled="isSlotDisabled(slot)"
          @click="selectTime(slot)"
        >
          {{ formatTimeSlot(slot) }}
        </button>
      </div>

      <div v-if="pricePreview" class="summary card">
        <h3>Ringkasan</h3>
        <div class="summary-row">
          <span>Barber</span>
          <span>{{ selectedBarber?.name }}</span>
        </div>
        <div class="summary-row">
          <span>Layanan</span>
          <span>{{ selectedService?.name }}</span>
        </div>
        <AppAlert v-if="auth.isMember" type="success" message="Diskon Member 50% diterapkan!" />
        <div class="summary-row total">
          <span>Total</span>
          <span>
            <s v-if="pricePreview.discountApplied" class="original">
              {{ formatPrice(pricePreview.originalPrice) }}
            </s>
            {{ formatPrice(pricePreview.finalPrice) }}
          </span>
        </div>
      </div>

      <button
        class="btn btn-primary"
        style="margin-top: 1rem"
        :disabled="!canProceedToPayment()"
        @click="goToPayment"
      >
        Lanjut ke Pembayaran
        <AppIcon icon="mdi:arrow-right" :size="18" />
      </button>
    </section>
  </div>
</template>

<style scoped>
.stepper {
  margin-bottom: 2rem;
  padding: 0 0.25rem;
}

.stepper-track {
  display: flex;
  align-items: flex-start;
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.stepper-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  background: var(--border);
  color: var(--text-muted);
  border: 2.5px solid var(--border);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.stepper-item.active .stepper-circle {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.stepper-item.current .stepper-circle {
  box-shadow: 0 0 0 4px rgba(86, 1, 26, 0.15);
  transform: scale(1.08);
}

.stepper-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0.5rem;
  text-align: center;
  min-width: 80px;
}

.stepper-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  transition: color 0.3s ease;
}

.stepper-item.active .stepper-title {
  color: var(--primary);
}

.stepper-desc {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}

.stepper-item.current .stepper-desc {
  opacity: 1;
}

.stepper-line {
  flex: 1;
  height: 3px;
  background: var(--border);
  margin-top: 17px; /* vertically center with the 36px circle */
  border-radius: 2px;
  position: relative;
  overflow: hidden;
  transition: background 0.35s ease;
}

.stepper-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.stepper-line.active::after {
  transform: scaleX(1);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--primary);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.summary .app-alert {
  margin: 0.5rem 0;
}

.barber-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.barber-option {
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.barber-option.selected,
.barber-option:hover {
  border-color: var(--accent);
}

.barber-option img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  border: 2px solid var(--border);
}

.barber-option h3 {
  font-size: 0.85rem;
  color: var(--primary);
}

.barber-option p {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.7rem;
  color: var(--accent-dark);
}

.service-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-option {
  display: flex;
  gap: 0.75rem;
  text-align: left;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.service-option.selected,
.service-option:hover {
  border-color: var(--accent);
}

.service-option .icon {
  font-size: 2rem;
}

.service-option h3 {
  font-size: 0.95rem;
  color: var(--primary);
}

.service-option p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.service-option .price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-dark);
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.time-slot {
  padding: 0.6rem;
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text);
  transition: all 0.15s;
}

.time-slot.selected {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.time-slot.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.summary h3 {
  color: var(--primary);
  margin-bottom: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 0.35rem 0;
  color: var(--text-muted);
}

.summary-row.total {
  font-weight: 700;
  color: var(--primary);
  border-top: 1px solid var(--border);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-size: 1rem;
}

.summary-discount {
  background: rgba(184, 139, 0, 0.12);
  color: var(--accent-dark);
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}

.original {
  color: var(--text-muted);
  font-weight: 400;
  margin-right: 0.35rem;
}
</style>

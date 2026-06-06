<script setup>
import { ref, computed, watch } from 'vue'
import { db } from '../db/database'
import { CANCEL_REASONS } from '../constants/membership'
import { canCancelBooking, getRefundInfo } from '../utils/cancellation'
import { formatDate, formatPrice, formatTimeSlot } from '../utils/timeSlots'
import AppIcon from './AppIcon.vue'
import AppAlert from './AppAlert.vue'

const props = defineProps({
  bookingId: { type: String, default: null },
})

const emit = defineEmits(['close', 'cancelled'])

const reason = ref('')
const note = ref('')
const loading = ref(false)
const agreed = ref(false)

const booking = computed(() => (props.bookingId ? db.getBookingById(props.bookingId) : null))
const barber = computed(() => (booking.value ? db.getBarberById(booking.value.barberId) : null))
const service = computed(() => (booking.value ? db.getServiceById(booking.value.serviceId) : null))
const cancelCheck = computed(() => (booking.value ? canCancelBooking(booking.value) : { allowed: false }))
const refundInfo = computed(() => (booking.value ? getRefundInfo(booking.value) : null))

const canSubmit = computed(
  () => cancelCheck.value.allowed && reason.value && agreed.value && !loading.value
)

watch(
  () => props.bookingId,
  () => {
    reason.value = ''
    note.value = ''
    agreed.value = false
    loading.value = false
  }
)

function close() {
  emit('close')
}

async function submitCancel() {
  if (!canSubmit.value || !booking.value) return
  loading.value = true
  await new Promise((r) => setTimeout(r, 800))
  emit('cancelled', {
    bookingId: booking.value.id,
    reason: reason.value,
    note: note.value,
    refundAmount: refundInfo.value.amount,
    refundPercent: refundInfo.value.percent,
  })
  loading.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="bookingId && booking" class="modal-overlay" @click.self="close">
        <div class="modal card" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <button class="modal-close" aria-label="Tutup" @click="close">
            <AppIcon icon="mdi:close" :size="22" />
          </button>

          <div class="modal-header">
            <AppIcon icon="mdi:calendar-remove" :size="32" color="var(--danger)" />
            <h2 id="cancel-title">Batalkan Booking</h2>
            <p>Pastikan Anda memahami kebijakan pembatalan sebelum melanjutkan.</p>
          </div>

          <div class="booking-summary">
            <div class="summary-row">
              <AppIcon icon="mdi:account-tie" :size="18" />
              <span>{{ barber?.name }}</span>
            </div>
            <div class="summary-row">
              <AppIcon icon="mdi:scissors-cutting" :size="18" />
              <span>{{ service?.name }}</span>
            </div>
            <div class="summary-row">
              <AppIcon icon="mdi:calendar" :size="18" />
              <span>{{ formatDate(booking.date) }}</span>
            </div>
            <div class="summary-row">
              <AppIcon icon="mdi:clock-outline" :size="18" />
              <span>{{ formatTimeSlot(booking.timeSlot) }}</span>
            </div>
            <div class="summary-row total">
              <AppIcon icon="mdi:cash" :size="18" />
              <span>{{ formatPrice(booking.finalPrice) }}</span>
            </div>
          </div>

          <AppAlert v-if="!cancelCheck.allowed" type="error" :message="cancelCheck.reason" />

          <template v-else>
            <AppAlert type="info" title="Kebijakan Pembatalan">
              <ul class="policy-list">
                <li>Pembatalan minimal <strong>2 jam</strong> sebelum jadwal</li>
                <li>&gt;24 jam: refund <strong>100%</strong></li>
                <li>2–24 jam: refund <strong>50%</strong></li>
                <li>&lt;2 jam: <strong>tidak ada</strong> refund</li>
              </ul>
            </AppAlert>

            <div v-if="refundInfo" class="refund-box" :class="`refund--${refundInfo.percent}`">
              <AppIcon
                :icon="refundInfo.percent === 100 ? 'mdi:cash-refund' : refundInfo.percent === 50 ? 'mdi:cash-minus' : 'mdi:cash-remove'"
                :size="24"
              />
              <div>
                <strong>{{ refundInfo.label }} — {{ formatPrice(refundInfo.amount) }}</strong>
                <p>{{ refundInfo.description }}</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="cancel-reason">Alasan Pembatalan *</label>
              <select id="cancel-reason" v-model="reason" class="form-input">
                <option value="" disabled>Pilih alasan</option>
                <option v-for="r in CANCEL_REASONS" :key="r.value" :value="r.value">
                  {{ r.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="cancel-note">Catatan tambahan (opsional)</label>
              <textarea
                id="cancel-note"
                v-model="note"
                class="form-input"
                rows="2"
                placeholder="Jelaskan lebih detail jika perlu..."
              />
            </div>

            <label class="agree-check">
              <input v-model="agreed" type="checkbox" />
              <span>Saya memahami kebijakan pembatalan dan refund di atas</span>
            </label>
          </template>

          <div class="modal-actions">
            <button class="btn btn-outline" @click="close">Tutup</button>
            <button
              v-if="cancelCheck.allowed"
              class="btn btn-danger"
              :disabled="!canSubmit"
              @click="submitCancel"
            >
              <AppIcon v-if="loading" icon="mdi:loading" :size="18" class="spin" />
              {{ loading ? 'Memproses...' : 'Konfirmasi Pembatalan' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(26, 26, 26, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

@media (min-width: 640px) {
  .modal-overlay {
    align-items: center;
    padding: 1rem;
  }
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 1.25rem;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  position: relative;
}

@media (min-width: 640px) {
  .modal {
    border-radius: var(--radius-lg);
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: var(--text-muted);
  padding: 0.25rem;
}

.modal-header {
  text-align: center;
  margin-bottom: 1rem;
  padding-right: 2rem;
}

.modal-header h2 {
  font-size: 1.15rem;
  color: var(--primary);
  margin: 0.5rem 0 0.25rem;
}

.modal-header p {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.booking-summary {
  background: var(--bg);
  border-radius: var(--radius);
  padding: 0.85rem;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  padding: 0.3rem 0;
}

.summary-row.total {
  font-weight: 700;
  color: var(--primary);
  border-top: 1px solid var(--border);
  margin-top: 0.35rem;
  padding-top: 0.5rem;
}

.policy-list {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.85rem;
  line-height: 1.6;
}

.refund-box {
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
  border: 1px solid;
}

.refund--100 {
  background: rgba(45, 106, 79, 0.08);
  border-color: rgba(45, 106, 79, 0.2);
  color: var(--success);
}

.refund--50 {
  background: rgba(184, 134, 11, 0.1);
  border-color: rgba(184, 134, 11, 0.25);
  color: var(--warning);
}

.refund--0 {
  background: rgba(155, 34, 38, 0.08);
  border-color: rgba(155, 34, 38, 0.2);
  color: var(--danger);
}

.refund-box p {
  font-size: 0.8rem;
  margin-top: 0.15rem;
  opacity: 0.9;
}

.agree-check {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  cursor: pointer;
}

.agree-check input {
  margin-top: 0.2rem;
  accent-color: var(--primary);
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-actions .btn {
  flex: 1;
}

.btn-danger {
  background: var(--danger);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-danger:disabled {
  opacity: 0.5;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(100%);
}

@media (min-width: 640px) {
  .modal-enter-from .modal,
  .modal-leave-to .modal {
    transform: scale(0.95) translateY(8px);
  }
}
</style>

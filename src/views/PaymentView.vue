<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

// ── Payment method selection ──
const paymentMethod = ref('qris')

// ── Global state ──
const processing = ref(false)
const success = ref(false)
const createdBooking = ref(null)
const orderSnapshot = ref(null)

// ── QRIS state ──
const qrisStep = ref('idle') // idle | showing | processing | done
const qrisTimer = ref(300) // 5 minute countdown
let qrisInterval = null

// ── Card state ──
const cardStep = ref('idle') // idle | form | verifying | otp | done
const cardForm = ref({
  number: '',
  name: '',
  expiry: '',
  cvv: '',
})
const otpCode = ref('')
const otpError = ref('')
const cardVerifyProgress = ref(0)

// ── E-Wallet state ──
const ewalletStep = ref('idle') // idle | selecting | redirecting | done
const selectedWallet = ref(null)
const ewalletRedirectTimer = ref(3)
let ewalletInterval = null

const wallets = [
  { id: 'gopay', name: 'GoPay', icon: 'mdi:wallet', color: '#00AED6' },
  { id: 'ovo', name: 'OVO', icon: 'mdi:cellphone-nfc', color: '#4C3494' },
  { id: 'dana', name: 'DANA', icon: 'mdi:contactless-payment', color: '#108EE9' },
  { id: 'shopeepay', name: 'ShopeePay', icon: 'mdi:shopping', color: '#EE4D2D' },
]

// ── Booking data ──
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

// ── Format QRIS timer as MM:SS ──
const qrisTimerFormatted = computed(() => {
  const m = Math.floor(qrisTimer.value / 60)
  const s = qrisTimer.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

// ── Format card number with spaces ──
function formatCardNumber(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 16)
  v = v.replace(/(.{4})/g, '$1 ').trim()
  cardForm.value.number = v
}

function formatExpiry(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 4)
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
  cardForm.value.expiry = v
}

// ── Generate QR data pattern (deterministic from price) ──
const qrMatrix = computed(() => {
  const size = 25
  const matrix = []
  const seed = (pricePreview.value?.finalPrice ?? 12345) + 42
  let rng = seed
  function nextRng() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff
    return rng
  }
  for (let r = 0; r < size; r++) {
    const row = []
    for (let c = 0; c < size; c++) {
      // Finder patterns (three corners)
      const inTopLeft = r < 7 && c < 7
      const inTopRight = r < 7 && c >= size - 7
      const inBottomLeft = r >= size - 7 && c < 7
      if (inTopLeft || inTopRight || inBottomLeft) {
        const oR = inTopLeft ? r : inBottomLeft ? r - (size - 7) : r
        const oC = inTopLeft ? c : inTopRight ? c - (size - 7) : c
        if (oR === 0 || oR === 6 || oC === 0 || oC === 6) row.push(1)
        else if (oR >= 2 && oR <= 4 && oC >= 2 && oC <= 4) row.push(1)
        else row.push(0)
      } else {
        row.push(nextRng() % 3 === 0 ? 1 : 0)
      }
    }
    matrix.push(row)
  }
  return matrix
})

// ── Lifecycle ──
onMounted(() => {
  if (!isValid.value) {
    alert.warning('Lengkapi data booking terlebih dahulu.')
    router.replace('/book')
    return
  }
  orderSnapshot.value = { ...draft.value }
})

onUnmounted(() => {
  clearInterval(qrisInterval)
  clearInterval(ewalletInterval)
})

// Reset sub-steps when switching methods
watch(paymentMethod, () => {
  clearInterval(qrisInterval)
  clearInterval(ewalletInterval)
  qrisStep.value = 'idle'
  qrisTimer.value = 300
  cardStep.value = 'idle'
  cardForm.value = { number: '', name: '', expiry: '', cvv: '' }
  otpCode.value = ''
  otpError.value = ''
  cardVerifyProgress.value = 0
  ewalletStep.value = 'idle'
  selectedWallet.value = null
  ewalletRedirectTimer.value = 3
})

// ════════════════════════════════════════
//  QRIS Flow
// ════════════════════════════════════════
function startQris() {
  qrisStep.value = 'showing'
  qrisTimer.value = 300
  qrisInterval = setInterval(() => {
    qrisTimer.value--
    if (qrisTimer.value <= 0) {
      clearInterval(qrisInterval)
      qrisStep.value = 'idle'
      alert.warning('QRIS expired. Silakan generate ulang.')
    }
  }, 1000)
}

async function confirmQrisPayment() {
  clearInterval(qrisInterval)
  qrisStep.value = 'processing'
  // Simulate bank verification
  await new Promise((r) => setTimeout(r, 2000))
  qrisStep.value = 'done'
  await new Promise((r) => setTimeout(r, 800))
  finalizePayment('qris')
}

// ════════════════════════════════════════
//  Card Flow
// ════════════════════════════════════════
function startCardForm() {
  cardStep.value = 'form'
}

const cardFormValid = computed(() => {
  const n = cardForm.value.number.replace(/\s/g, '')
  return (
    n.length === 16 &&
    cardForm.value.name.trim().length >= 3 &&
    /^\d{2}\/\d{2}$/.test(cardForm.value.expiry) &&
    cardForm.value.cvv.length >= 3
  )
})

async function submitCard() {
  if (!cardFormValid.value) return
  cardStep.value = 'verifying'
  cardVerifyProgress.value = 0

  // Simulate verification progress
  for (let i = 0; i <= 100; i += 2) {
    await new Promise((r) => setTimeout(r, 30))
    cardVerifyProgress.value = i
  }

  await new Promise((r) => setTimeout(r, 300))
  cardStep.value = 'otp'
}

async function verifyOtp() {
  if (otpCode.value.length !== 6) {
    otpError.value = 'Kode OTP harus 6 digit'
    return
  }
  otpError.value = ''
  cardStep.value = 'verifying'
  cardVerifyProgress.value = 0

  for (let i = 0; i <= 100; i += 4) {
    await new Promise((r) => setTimeout(r, 25))
    cardVerifyProgress.value = i
  }

  await new Promise((r) => setTimeout(r, 500))
  cardStep.value = 'done'
  await new Promise((r) => setTimeout(r, 800))
  finalizePayment('card')
}

// ════════════════════════════════════════
//  E-Wallet Flow
// ════════════════════════════════════════
function startEwallet() {
  ewalletStep.value = 'selecting'
}

function selectWallet(wallet) {
  selectedWallet.value = wallet
  ewalletStep.value = 'redirecting'
  ewalletRedirectTimer.value = 3

  ewalletInterval = setInterval(() => {
    ewalletRedirectTimer.value--
    if (ewalletRedirectTimer.value <= 0) {
      clearInterval(ewalletInterval)
      simulateEwalletPayment()
    }
  }, 1000)
}

async function simulateEwalletPayment() {
  ewalletStep.value = 'redirecting'
  await new Promise((r) => setTimeout(r, 2000))
  ewalletStep.value = 'done'
  await new Promise((r) => setTimeout(r, 800))
  finalizePayment('ewallet')
}

// ════════════════════════════════════════
//  Finalize (shared)
// ════════════════════════════════════════
function finalizePayment(method) {
  processing.value = true
  try {
    createdBooking.value = bookingStore.createBooking(method)
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
    <!-- ═══════════════ PAYMENT FORM ═══════════════ -->
    <template v-if="!success">
      <h1 class="page-title">Pembayaran</h1>
      <p class="page-subtitle">Pilih metode dan selesaikan pembayaran</p>

      <AppAlert type="info" message="Ini simulasi pembayaran. Tidak ada transaksi nyata yang diproses." />

      <!-- Order Summary -->
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

      <!-- Payment Method Selection -->
      <div class="payment-methods card">
        <h3>Metode Pembayaran</h3>

        <label class="payment-option" :class="{ active: paymentMethod === 'qris' }">
          <input v-model="paymentMethod" type="radio" value="qris" />
          <AppIcon icon="mdi:qrcode-scan" :size="28" color="var(--primary)" />
          <div>
            <strong>QRIS</strong>
            <p>Scan QR code — semua bank & e-wallet</p>
          </div>
        </label>

        <label class="payment-option" :class="{ active: paymentMethod === 'card' }">
          <input v-model="paymentMethod" type="radio" value="card" />
          <AppIcon icon="mdi:credit-card-outline" :size="28" color="var(--primary)" />
          <div>
            <strong>Kartu Debit/Kredit</strong>
            <p>Visa, Mastercard, JCB</p>
          </div>
        </label>

        <label class="payment-option" :class="{ active: paymentMethod === 'ewallet' }">
          <input v-model="paymentMethod" type="radio" value="ewallet" />
          <AppIcon icon="mdi:cellphone" :size="28" color="var(--primary)" />
          <div>
            <strong>E-Wallet</strong>
            <p>GoPay, OVO, DANA, ShopeePay</p>
          </div>
        </label>
      </div>

      <!-- ═══════════ QRIS FLOW ═══════════ -->
      <div v-if="paymentMethod === 'qris'" class="mock-flow card">
        <!-- Idle: show button to generate QR -->
        <div v-if="qrisStep === 'idle'" class="flow-cta">
          <AppIcon icon="mdi:qrcode" :size="48" color="var(--text-muted)" class="flow-cta-icon" />
          <p>Generate kode QRIS untuk pembayaran</p>
          <button class="btn btn-primary" @click="startQris">
            <AppIcon icon="mdi:qrcode-scan" :size="18" />
            Generate QRIS
          </button>
        </div>

        <!-- Showing QR -->
        <div v-if="qrisStep === 'showing'" class="qris-display">
          <div class="qris-header">
            <span class="qris-badge">
              <AppIcon icon="mdi:shield-check" :size="14" />
              QRIS Verified
            </span>
            <span class="qris-timer" :class="{ urgent: qrisTimer < 60 }">
              <AppIcon icon="mdi:timer-outline" :size="16" />
              {{ qrisTimerFormatted }}
            </span>
          </div>

          <div class="qris-card">
            <div class="qris-label">Koko Barber</div>

            <!-- SVG-based QR Code -->
            <div class="qr-wrapper">
              <svg :viewBox="`0 0 ${qrMatrix.length} ${qrMatrix.length}`" class="qr-svg">
                <rect :width="qrMatrix.length" :height="qrMatrix.length" fill="white" />
                <template v-for="(row, r) in qrMatrix" :key="r">
                  <rect
                    v-for="(cell, c) in row"
                    :key="`${r}-${c}`"
                    v-show="cell === 1"
                    :x="c"
                    :y="r"
                    width="1"
                    height="1"
                    fill="#1a1a1a"
                    rx="0.1"
                  />
                </template>
              </svg>
              <div class="qr-logo">
                <AppIcon icon="mdi:store" :size="20" color="var(--primary)" />
              </div>
            </div>

            <p class="qris-amount">{{ formatPrice(pricePreview?.finalPrice ?? 0) }}</p>
            <p class="qris-hint">Scan menggunakan aplikasi e-banking atau e-wallet Anda</p>
          </div>

          <button class="btn btn-primary" @click="confirmQrisPayment">
            <AppIcon icon="mdi:check-circle" :size="18" />
            Saya Sudah Bayar
          </button>
        </div>

        <!-- Processing -->
        <div v-if="qrisStep === 'processing'" class="flow-processing">
          <div class="processing-ring">
            <div class="ring-spinner"></div>
            <AppIcon icon="mdi:bank-transfer" :size="28" color="var(--primary)" class="ring-icon" />
          </div>
          <h3>Memverifikasi Pembayaran</h3>
          <p>Mengecek status pembayaran dari bank...</p>
          <div class="processing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Done (brief flash before success) -->
        <div v-if="qrisStep === 'done'" class="flow-done">
          <div class="done-check">
            <AppIcon icon="mdi:check-bold" :size="32" color="#fff" />
          </div>
          <h3>Pembayaran Diterima!</h3>
        </div>
      </div>

      <!-- ═══════════ CARD FLOW ═══════════ -->
      <div v-if="paymentMethod === 'card'" class="mock-flow card">
        <!-- Idle -->
        <div v-if="cardStep === 'idle'" class="flow-cta">
          <AppIcon icon="mdi:credit-card-plus-outline" :size="48" color="var(--text-muted)" class="flow-cta-icon" />
          <p>Masukkan detail kartu Anda</p>
          <button class="btn btn-primary" @click="startCardForm">
            <AppIcon icon="mdi:credit-card-plus" :size="18" />
            Tambah Kartu
          </button>
        </div>

        <!-- Card Form -->
        <div v-if="cardStep === 'form'" class="card-form-flow">
          <!-- Card visual preview -->
          <div class="card-preview">
            <div class="card-preview-bg">
              <div class="card-chip">
                <AppIcon icon="mdi:chip" :size="28" color="rgba(255,255,255,0.8)" />
              </div>
              <div class="card-number-display">
                {{ cardForm.number || '•••• •••• •••• ••••' }}
              </div>
              <div class="card-preview-bottom">
                <div>
                  <span class="card-prev-label">Cardholder</span>
                  <span class="card-prev-value">{{ cardForm.name || 'YOUR NAME' }}</span>
                </div>
                <div>
                  <span class="card-prev-label">Expires</span>
                  <span class="card-prev-value">{{ cardForm.expiry || 'MM/YY' }}</span>
                </div>
              </div>
              <div class="card-brand">
                <AppIcon icon="mdi:credit-card-chip-outline" :size="32" color="rgba(255,255,255,0.6)" />
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cardNumber">Nomor Kartu</label>
            <input
              id="cardNumber"
              type="text"
              class="form-input"
              placeholder="1234 5678 9012 3456"
              :value="cardForm.number"
              maxlength="19"
              @input="formatCardNumber"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="cardName">Nama di Kartu</label>
            <input
              id="cardName"
              v-model="cardForm.name"
              type="text"
              class="form-input"
              placeholder="JOHN DOE"
              style="text-transform: uppercase"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cardExpiry">Masa Berlaku</label>
              <input
                id="cardExpiry"
                type="text"
                class="form-input"
                placeholder="MM/YY"
                :value="cardForm.expiry"
                maxlength="5"
                @input="formatExpiry"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="cardCvv">CVV</label>
              <input
                id="cardCvv"
                v-model="cardForm.cvv"
                type="password"
                class="form-input"
                placeholder="•••"
                maxlength="4"
              />
            </div>
          </div>
          <button class="btn btn-primary" :disabled="!cardFormValid" @click="submitCard">
            <AppIcon icon="mdi:lock-check" :size="18" />
            Verifikasi Kartu
          </button>
        </div>

        <!-- Verifying -->
        <div v-if="cardStep === 'verifying'" class="flow-processing">
          <div class="processing-ring">
            <div class="ring-spinner"></div>
            <AppIcon icon="mdi:credit-card-check-outline" :size="28" color="var(--primary)" class="ring-icon" />
          </div>
          <h3>Memverifikasi Kartu</h3>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: cardVerifyProgress + '%' }"></div>
          </div>
          <p class="progress-text">{{ cardVerifyProgress }}%</p>
        </div>

        <!-- OTP Verification -->
        <div v-if="cardStep === 'otp'" class="otp-flow">
          <div class="otp-icon-wrap">
            <AppIcon icon="mdi:cellphone-message" :size="48" color="var(--primary)" />
          </div>
          <h3>Verifikasi OTP</h3>
          <p>Kode OTP telah dikirim ke nomor yang terdaftar pada kartu Anda.</p>
          <p class="otp-hint">
            <AppIcon icon="mdi:information-outline" :size="14" />
            Untuk demo, masukkan 6 digit angka sembarang
          </p>
          <div class="otp-input-group">
            <input
              v-model="otpCode"
              type="text"
              class="form-input otp-input"
              placeholder="000000"
              maxlength="6"
              inputmode="numeric"
            />
          </div>
          <p v-if="otpError" class="form-error" style="text-align: center">{{ otpError }}</p>
          <button class="btn btn-primary" @click="verifyOtp">
            <AppIcon icon="mdi:shield-check" :size="18" />
            Konfirmasi OTP
          </button>
        </div>

        <!-- Done -->
        <div v-if="cardStep === 'done'" class="flow-done">
          <div class="done-check">
            <AppIcon icon="mdi:check-bold" :size="32" color="#fff" />
          </div>
          <h3>Pembayaran Berhasil!</h3>
        </div>
      </div>

      <!-- ═══════════ E-WALLET FLOW ═══════════ -->
      <div v-if="paymentMethod === 'ewallet'" class="mock-flow card">
        <!-- Idle -->
        <div v-if="ewalletStep === 'idle'" class="flow-cta">
          <AppIcon icon="mdi:wallet-outline" :size="48" color="var(--text-muted)" class="flow-cta-icon" />
          <p>Pilih e-wallet untuk pembayaran</p>
          <button class="btn btn-primary" @click="startEwallet">
            <AppIcon icon="mdi:wallet" :size="18" />
            Pilih E-Wallet
          </button>
        </div>

        <!-- Selecting wallet -->
        <div v-if="ewalletStep === 'selecting'" class="wallet-selection">
          <h3 class="wallet-title">Pilih E-Wallet</h3>
          <div class="wallet-grid">
            <button
              v-for="w in wallets"
              :key="w.id"
              class="wallet-item"
              @click="selectWallet(w)"
            >
              <div class="wallet-icon-circle" :style="{ background: w.color }">
                <AppIcon :icon="w.icon" :size="24" color="#fff" />
              </div>
              <span>{{ w.name }}</span>
            </button>
          </div>
        </div>

        <!-- Redirecting -->
        <div v-if="ewalletStep === 'redirecting'" class="flow-processing">
          <div class="processing-ring">
            <div class="ring-spinner"></div>
            <div class="wallet-icon-circle ring-wallet-icon" :style="{ background: selectedWallet?.color }">
              <AppIcon :icon="selectedWallet?.icon" :size="22" color="#fff" />
            </div>
          </div>
          <h3>Membuka {{ selectedWallet?.name }}</h3>
          <p v-if="ewalletRedirectTimer > 0">Mengalihkan ke aplikasi dalam {{ ewalletRedirectTimer }} detik...</p>
          <p v-else>Menunggu konfirmasi pembayaran...</p>
          <div class="processing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>

        <!-- Done -->
        <div v-if="ewalletStep === 'done'" class="flow-done">
          <div class="done-check">
            <AppIcon icon="mdi:check-bold" :size="32" color="#fff" />
          </div>
          <h3>Pembayaran Diterima!</h3>
        </div>
      </div>
    </template>

    <!-- ═══════════════ SUCCESS SCREEN ═══════════════ -->
    <template v-else>
      <div class="success-screen">
        <div class="success-confetti">
          <span v-for="i in 12" :key="i" class="confetti-piece" :style="{ '--i': i }"></span>
        </div>
        <div class="success-icon-wrap">
          <AppIcon icon="mdi:check-circle" :size="72" color="var(--success)" class="success-icon" />
        </div>
        <h1 class="page-title">Pembayaran Berhasil!</h1>
        <p class="page-subtitle">Booking Anda telah dikonfirmasi</p>

        <div class="card success-card">
          <p class="booking-id">ID: {{ createdBooking?.id?.slice(-8).toUpperCase() }}</p>
          <div class="success-detail-row">
            <AppIcon icon="mdi:account" :size="16" color="var(--text-muted)" />
            <span>{{ barber?.name }}</span>
          </div>
          <div class="success-detail-row">
            <AppIcon icon="mdi:content-cut" :size="16" color="var(--text-muted)" />
            <span>{{ service?.name }}</span>
          </div>
          <div class="success-detail-row">
            <AppIcon icon="mdi:calendar" :size="16" color="var(--text-muted)" />
            <span>{{ displayDate ? formatDate(displayDate) : '-' }}</span>
          </div>
          <div class="success-detail-row">
            <AppIcon icon="mdi:clock-outline" :size="16" color="var(--text-muted)" />
            <span>{{ displayTime ? formatTimeSlot(displayTime) : '-' }}</span>
          </div>
          <div class="success-total">
            <span>Total dibayar</span>
            <span class="success-price">{{ formatPrice(pricePreview?.finalPrice ?? 0) }}</span>
          </div>
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
/* ── Order Summary ── */
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

/* ── Payment Methods ── */
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
  transition: all 0.25s ease;
}

.payment-option.active {
  border-color: var(--accent);
  background: rgba(184, 139, 0, 0.05);
  box-shadow: 0 0 0 3px rgba(184, 139, 0, 0.1);
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

/* ── Mock Flow Container ── */
.mock-flow {
  margin-top: 1rem;
  overflow: hidden;
}

/* ── Flow CTA (idle state) ── */
.flow-cta {
  text-align: center;
  padding: 1.5rem 0.5rem;
}

.flow-cta-icon {
  margin-bottom: 0.75rem;
  opacity: 0.5;
}

.flow-cta p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* ═══════ QRIS ═══════ */
.qris-display {
  animation: fadeSlideUp 0.4s ease;
}

.qris-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.qris-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--success);
  background: rgba(45, 106, 79, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
}

.qris-timer {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.qris-timer.urgent {
  color: var(--danger);
  animation: pulse 1s ease infinite;
}

.qris-card {
  background: linear-gradient(135deg, #f8f6f3, #fff);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 1rem;
}

.qris-label {
  font-weight: 700;
  color: var(--primary);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.qr-wrapper {
  position: relative;
  display: inline-block;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin: 0 auto;
}

.qr-svg {
  width: 180px;
  height: 180px;
  display: block;
}

.qr-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.qris-amount {
  font-weight: 700;
  color: var(--primary);
  font-size: 1.25rem;
  margin-top: 1rem;
}

.qris-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

/* ═══════ Processing ═══════ */
.flow-processing {
  text-align: center;
  padding: 2rem 0.5rem;
  animation: fadeSlideUp 0.3s ease;
}

.processing-ring {
  width: 80px;
  height: 80px;
  position: relative;
  margin: 0 auto 1.25rem;
}

.ring-spinner {
  position: absolute;
  inset: 0;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.ring-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ring-wallet-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flow-processing h3 {
  color: var(--primary);
  margin-bottom: 0.4rem;
}

.flow-processing p {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.processing-dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1rem;
}

.processing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.3;
  animation: dotPulse 1.2s ease-in-out infinite;
}

.processing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.processing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

/* ═══════ Progress Bar ═══════ */
.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  margin: 1rem 0 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 3px;
  transition: width 0.15s linear;
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

/* ═══════ Done Flash ═══════ */
.flow-done {
  text-align: center;
  padding: 2rem 0.5rem;
  animation: fadeSlideUp 0.3s ease;
}

.done-check {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success), #3d8b6b);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.flow-done h3 {
  color: var(--success);
}

/* ═══════ Card Form ═══════ */
.card-form-flow {
  animation: fadeSlideUp 0.4s ease;
}

.card-preview {
  margin-bottom: 1.25rem;
}

.card-preview-bg {
  position: relative;
  background: linear-gradient(135deg, var(--primary), var(--primary-light), #9c1c3b);
  border-radius: 14px;
  padding: 1.25rem;
  color: #fff;
  min-height: 170px;
  box-shadow: 0 8px 24px rgba(86, 1, 26, 0.25);
  overflow: hidden;
}

.card-preview-bg::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.card-preview-bg::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: -20px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
}

.card-chip {
  margin-bottom: 1rem;
}

.card-number-display {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
  margin-bottom: 1rem;
}

.card-preview-bottom {
  display: flex;
  justify-content: space-between;
}

.card-prev-label {
  display: block;
  font-size: 0.6rem;
  text-transform: uppercase;
  opacity: 0.6;
  letter-spacing: 0.5px;
}

.card-prev-value {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.card-brand {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

/* ═══════ OTP ═══════ */
.otp-flow {
  text-align: center;
  padding: 1rem 0;
  animation: fadeSlideUp 0.4s ease;
}

.otp-icon-wrap {
  margin-bottom: 0.75rem;
}

.otp-flow h3 {
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.otp-flow > p {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.otp-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  font-size: 0.75rem !important;
  color: var(--accent-dark) !important;
  background: rgba(184, 139, 0, 0.08);
  padding: 0.35rem 0.6rem;
  border-radius: 8px;
  margin: 0 auto 1rem;
  width: fit-content;
}

.otp-input-group {
  max-width: 200px;
  margin: 0 auto 1rem;
}

.otp-input {
  text-align: center;
  font-size: 1.5rem !important;
  font-weight: 700;
  letter-spacing: 8px;
  font-variant-numeric: tabular-nums;
}

/* ═══════ E-Wallet ═══════ */
.wallet-selection {
  animation: fadeSlideUp 0.4s ease;
}

.wallet-title {
  color: var(--primary);
  margin-bottom: 1rem;
}

.wallet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.wallet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: var(--radius);
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-item:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.wallet-item span {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text);
}

.wallet-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ═══════ Success Screen ═══════ */
.success-screen {
  text-align: center;
  padding-top: 2rem;
  animation: fadeSlideUp 0.5s ease;
}

.success-icon-wrap {
  position: relative;
  display: inline-block;
  margin-bottom: 1rem;
}

.success-icon {
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-confetti {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 10;
}

.confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -10px;
  left: calc(var(--i) * 8.33% - 4%);
  opacity: 0;
  animation: confettiFall 2.5s ease-out forwards;
  animation-delay: calc(var(--i) * 0.1s);
}

.confetti-piece:nth-child(odd) {
  background: var(--accent);
  border-radius: 2px;
  transform: rotate(45deg);
}

.confetti-piece:nth-child(even) {
  background: var(--primary);
  border-radius: 50%;
}

.confetti-piece:nth-child(3n) {
  background: var(--success);
  width: 8px;
  height: 12px;
  border-radius: 1px;
}

.success-card {
  margin: 1.5rem 0;
  text-align: left;
}

.booking-id {
  font-weight: 700;
  color: var(--accent-dark);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.success-detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0.35rem 0;
}

.success-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
}

.success-total span:first-child {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.success-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

/* ═══════ Animations ═══════ */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes dotPulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  40% {
    opacity: 1;
    transform: scale(1.3);
  }
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    top: -10px;
    transform: rotate(0deg) translateX(0);
  }
  100% {
    opacity: 0;
    top: 100vh;
    transform: rotate(720deg) translateX(calc(var(--i) * 5px - 30px));
  }
}
</style>

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, calculatePrice } from '../db/database'
import { useAuthStore } from './auth'

export const useBookingStore = defineStore('booking', () => {
  const draft = ref({
    barberId: null,
    serviceId: null,
    date: null,
    timeSlot: null,
  })

  const pendingPayment = ref(null)

  function resetDraft() {
    draft.value = { barberId: null, serviceId: null, date: null, timeSlot: null }
  }

  function setDraftField(field, value) {
    draft.value[field] = value
  }

  function getPricePreview() {
    const auth = useAuthStore()
    const service = draft.value.serviceId ? db.getServiceById(draft.value.serviceId) : null
    if (!service) return null
    return calculatePrice(service.price, auth.user?.completedBookings ?? 0)
  }

  function getBookedSlots(barberId, date) {
    return db.getBookingsForBarberOnDate(barberId, date).map((b) => b.timeSlot)
  }

  function createBooking(paymentMethod = 'mock') {
    const auth = useAuthStore()
    if (!auth.user) throw new Error('Harus login terlebih dahulu')

    const { barberId, serviceId, date, timeSlot } = draft.value
    if (!barberId || !serviceId || !date || !timeSlot) {
      throw new Error('Lengkapi semua data booking')
    }

    const service = db.getServiceById(serviceId)
    const pricing = calculatePrice(service.price, auth.user.completedBookings)

    const booking = db.createBooking({
      userId: auth.user.id,
      barberId,
      serviceId,
      date,
      timeSlot,
      status: 'upcoming',
      originalPrice: pricing.originalPrice,
      finalPrice: pricing.finalPrice,
      discountApplied: pricing.discountApplied,
      paymentMethod,
      paidAt: new Date().toISOString(),
    })

    resetDraft()
    return booking
  }

  function getUserBookings() {
    const auth = useAuthStore()
    if (!auth.user) return []
    db.syncBookingStatuses()
    auth.refreshUser()
    return db.getBookingsByUser(auth.user.id)
  }

  function cancelBooking(bookingId, { reason, note, refundAmount, refundPercent } = {}) {
    return db.cancelBooking(bookingId, { reason, note, refundAmount, refundPercent })
  }

  function rateBooking(bookingId, rating, review) {
    return db.addRating(bookingId, { rating, review })
  }

  return {
    draft,
    pendingPayment,
    resetDraft,
    setDraftField,
    getPricePreview,
    getBookedSlots,
    createBooking,
    getUserBookings,
    cancelBooking,
    rateBooking,
  }
})

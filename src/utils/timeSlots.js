export const OPEN_HOUR = 10
export const CLOSE_HOUR = 22
export const SLOT_INTERVAL = 30

export function generateTimeSlots() {
  const slots = []
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_INTERVAL) {
      const endMinutes = hour * 60 + min + SLOT_INTERVAL
      if (endMinutes > CLOSE_HOUR * 60) break
      const h = String(hour).padStart(2, '0')
      const m = String(min).padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots
}

export function formatTimeSlot(slot) {
  const [h, m] = slot.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'))
}

export function getMinBookingDate() {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export function isSlotInPast(date, timeSlot) {
  const slotDate = new Date(`${date}T${timeSlot}:00`)
  return slotDate <= new Date()
}

import { SEED_BARBERS, SEED_SERVICES, SEED_USERS, SEED_BOOKINGS } from './seed'

const DB_KEY = 'koko_barber_db'
const SESSION_KEY = 'koko_barber_session'

function createEmptyDb() {
  return {
    users: [...SEED_USERS],
    barbers: [...SEED_BARBERS],
    services: [...SEED_SERVICES],
    bookings: [...SEED_BOOKINGS],
    version: 1,
  }
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      const db = createEmptyDb()
      saveDb(db)
      return db
    }
    return JSON.parse(raw)
  } catch {
    const db = createEmptyDb()
    saveDb(db)
    return db
  }
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export const db = {
  init() {
    loadDb()
  },

  reset() {
    localStorage.removeItem(DB_KEY)
    localStorage.removeItem(SESSION_KEY)
    return createEmptyDb()
  },

  getBarbers() {
    return loadDb().barbers
  },

  getBarberById(id) {
    return loadDb().barbers.find((b) => b.id === id) ?? null
  },

  getServices() {
    return loadDb().services
  },

  getServiceById(id) {
    return loadDb().services.find((s) => s.id === id) ?? null
  },

  getUserByEmail(email) {
    return loadDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
  },

  getUserById(id) {
    return loadDb().users.find((u) => u.id === id) ?? null
  },

  registerUser({ name, email, phone, password }) {
    const data = loadDb()
    if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email sudah terdaftar')
    }
    const user = {
      id: generateId('user'),
      name,
      email,
      phone,
      password,
      completedBookings: 0,
      createdAt: new Date().toISOString(),
    }
    data.users.push(user)
    saveDb(data)
    return user
  },

  loginUser(email, password) {
    const user = this.getUserByEmail(email)
    if (!user || user.password !== password) {
      throw new Error('Email atau password salah')
    }
    return user
  },

  updateUser(userId, updates) {
    const data = loadDb()
    const idx = data.users.findIndex((u) => u.id === userId)
    if (idx === -1) return null
    data.users[idx] = { ...data.users[idx], ...updates }
    saveDb(data)
    return data.users[idx]
  },

  getBookingsByUser(userId) {
    return loadDb()
      .bookings.filter((b) => b.userId === userId)
      .sort((a, b) => new Date(`${b.date}T${b.timeSlot}`) - new Date(`${a.date}T${a.timeSlot}`))
  },

  getBookingsForBarberOnDate(barberId, date) {
    return loadDb().bookings.filter(
      (b) => b.barberId === barberId && b.date === date && b.status !== 'cancelled'
    )
  },

  createBooking(booking) {
    const data = loadDb()
    const newBooking = {
      id: generateId('booking'),
      rated: false,
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
      ...booking,
    }
    data.bookings.push(newBooking)
    saveDb(data)
    return newBooking
  },

  updateBooking(bookingId, updates) {
    const data = loadDb()
    const idx = data.bookings.findIndex((b) => b.id === bookingId)
    if (idx === -1) return null
    data.bookings[idx] = { ...data.bookings[idx], ...updates }
    saveDb(data)
    return data.bookings[idx]
  },

  getBookingById(id) {
    return loadDb().bookings.find((b) => b.id === id) ?? null
  },

  cancelBooking(bookingId, { reason, note, refundAmount, refundPercent } = {}) {
    return this.updateBooking(bookingId, {
      status: 'cancelled',
      cancelReason: reason ?? null,
      cancelNote: note ?? null,
      refundAmount: refundAmount ?? 0,
      refundPercent: refundPercent ?? 0,
      cancelledAt: new Date().toISOString(),
    })
  },

  incrementCompletedBookings(userId) {
    const user = this.getUserById(userId)
    if (!user) return
    return this.updateUser(userId, { completedBookings: user.completedBookings + 1 })
  },

  addRating(bookingId, { rating, review }) {
    const booking = this.getBookingById(bookingId)
    if (!booking) throw new Error('Booking tidak ditemukan')

    const updated = this.updateBooking(bookingId, {
      rated: true,
      rating,
      review,
    })

    const data = loadDb()
    const barberIdx = data.barbers.findIndex((b) => b.id === booking.barberId)
    if (barberIdx !== -1) {
      const barber = data.barbers[barberIdx]
      const newCount = barber.reviewCount + 1
      const newRating = (barber.rating * barber.reviewCount + rating) / newCount
      data.barbers[barberIdx] = {
        ...barber,
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newCount,
      }
      saveDb(data)
    }

    return updated
  },

  syncBookingStatuses() {
    const data = loadDb()
    const now = new Date()
    let changed = false

    data.bookings.forEach((booking, idx) => {
      if (booking.status === 'cancelled' || booking.status === 'completed') return

      const slotStart = new Date(`${booking.date}T${booking.timeSlot}:00`)
      const service = data.services.find((s) => s.id === booking.serviceId)
      const duration = service?.duration ?? 30
      const slotEnd = new Date(slotStart.getTime() + duration * 60000)

      if (now >= slotEnd && booking.status !== 'completed') {
        data.bookings[idx] = { ...booking, status: 'completed' }
        const user = data.users.find((u) => u.id === booking.userId)
        if (user) {
          const userIdx = data.users.findIndex((u) => u.id === booking.userId)
          data.users[userIdx] = {
            ...user,
            completedBookings: user.completedBookings + 1,
          }
        }
        changed = true
      } else if (now >= slotStart && booking.status === 'upcoming') {
        data.bookings[idx] = { ...booking, status: 'ongoing' }
        changed = true
      }
    })

    if (changed) saveDb(data)
    return data.bookings
  },
}

export const session = {
  get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  set(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }))
  },

  clear() {
    localStorage.removeItem(SESSION_KEY)
  },
}

export const MEMBERSHIP_THRESHOLD = 10
export const MEMBER_DISCOUNT = 0.5

export function isEligibleForDiscount(completedBookings) {
  return completedBookings >= MEMBERSHIP_THRESHOLD
}

export function calculatePrice(originalPrice, completedBookings) {
  if (isEligibleForDiscount(completedBookings)) {
    return {
      originalPrice,
      finalPrice: Math.round(originalPrice * (1 - MEMBER_DISCOUNT)),
      discountApplied: true,
      discountPercent: MEMBER_DISCOUNT * 100,
    }
  }
  return {
    originalPrice,
    finalPrice: originalPrice,
    discountApplied: false,
    discountPercent: 0,
  }
}

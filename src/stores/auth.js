import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, session, isEligibleForDiscount, MEMBERSHIP_THRESHOLD } from '../db/database'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const isMember = computed(() =>
    user.value ? isEligibleForDiscount(user.value.completedBookings) : false
  )
  const bookingsUntilMember = computed(() => {
    if (!user.value) return MEMBERSHIP_THRESHOLD
    return Math.max(0, MEMBERSHIP_THRESHOLD - user.value.completedBookings)
  })

  function init() {
    db.init()
    db.syncBookingStatuses()
    const sess = session.get()
    if (sess?.userId) {
      user.value = db.getUserById(sess.userId)
    }
  }

  function refreshUser() {
    if (user.value) {
      user.value = db.getUserById(user.value.id)
    }
  }

  function login(email, password) {
    const loggedIn = db.loginUser(email, password)
    user.value = loggedIn
    session.set(loggedIn.id)
    return loggedIn
  }

  function register(payload) {
    const newUser = db.registerUser(payload)
    user.value = newUser
    session.set(newUser.id)
    return newUser
  }

  function logout() {
    user.value = null
    session.clear()
  }

  return {
    user,
    isLoggedIn,
    isMember,
    bookingsUntilMember,
    init,
    refreshUser,
    login,
    register,
    logout,
  }
})

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAlertStore } from '../stores/alert'
import { db, MEMBERSHIP_THRESHOLD } from '../db/database'
import { getMemberTier } from '../constants/membership'
import MembershipTiers from '../components/MembershipTiers.vue'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()
const alert = useAlertStore()

const currentTier = computed(() => getMemberTier(auth.user?.completedBookings ?? 0))

function logout() {
  auth.logout()
  alert.info('Anda telah keluar dari akun.')
  router.push('/')
}

async function resetDemo() {
  const ok = await alert.confirm({
    title: 'Reset Data Demo?',
    message: 'Semua data akan dikembalikan ke kondisi awal dan Anda akan logout.',
    confirmText: 'Reset',
    cancelText: 'Batal',
    variant: 'danger',
  })
  if (ok) {
    db.reset()
    auth.logout()
    auth.init()
    alert.success('Data berhasil direset ke kondisi awal.')
    router.push('/')
  }
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">Profil</h1>

    <template v-if="auth.isLoggedIn">
      <div class="profile-card card">
        <div class="avatar">{{ auth.user.name.charAt(0).toUpperCase() }}</div>
        <h2>{{ auth.user.name }}</h2>
        <p>{{ auth.user.email }}</p>
        <p>{{ auth.user.phone }}</p>

        <div class="tier-badge-row">
          <AppIcon :icon="currentTier.icon" :size="22" :color="currentTier.color" />
          <span class="badge badge-member">{{ currentTier.name }}</span>
        </div>

        <div v-if="auth.isMember" class="member-info">
          <p>Diskon 50% aktif untuk setiap booking</p>
        </div>
        <div v-else class="member-info">
          <p>{{ auth.user.completedBookings }}/{{ MEMBERSHIP_THRESHOLD }} kunjungan selesai</p>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: `${(auth.user.completedBookings / MEMBERSHIP_THRESHOLD) * 100}%` }"
            />
          </div>
        </div>
      </div>

      <MembershipTiers compact />

      <div class="menu-list">
        <router-link to="/history" class="menu-item card">
          <AppIcon icon="mdi:clipboard-text-outline" :size="22" />
          Riwayat Transaksi
        </router-link>
        <router-link to="/book" class="menu-item card">
          <AppIcon icon="mdi:calendar-plus" :size="22" />
          Booking Baru
        </router-link>
      </div>

      <button class="btn btn-outline logout-btn" @click="logout">
        <AppIcon icon="mdi:logout" :size="18" />
        Keluar
      </button>
      <button class="btn btn-ghost btn-sm" @click="resetDemo">
        <AppIcon icon="mdi:backup-restore" :size="16" />
        Reset Data Demo
      </button>
    </template>

    <template v-else>
      <div class="guest-card card">
        <AppIcon icon="mdi:account-circle-outline" :size="64" color="var(--text-muted)" />
        <h2>Belum Masuk</h2>
        <p>Login atau daftar untuk booking dan membership</p>
        <router-link to="/login" class="btn btn-primary guest-btn">
          <AppIcon icon="mdi:login" :size="18" />
          Masuk
        </router-link>
        <router-link to="/register" class="btn btn-outline guest-btn">
          <AppIcon icon="mdi:account-plus" :size="18" />
          Daftar
        </router-link>
      </div>

      <MembershipTiers />
    </template>
  </div>
</template>

<style scoped>
.profile-card {
  text-align: center;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.profile-card h2 {
  color: var(--primary);
}

.profile-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.tier-badge-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.member-info {
  margin-top: 0.75rem;
}

.member-info p {
  font-size: 0.85rem;
}

.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 999px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  border-radius: 999px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  color: var(--primary);
  transition: background 0.2s;
}

.menu-item:hover {
  background: rgba(86, 1, 26, 0.04);
}

.logout-btn {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.guest-card {
  text-align: center;
  padding: 2rem 1.5rem;
}

.guest-card h2 {
  color: var(--primary);
  margin: 0.5rem 0;
}

.guest-card p {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.guest-btn {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}
</style>

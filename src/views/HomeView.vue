<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../db/database'
import { useAuthStore } from '../stores/auth'
import { getMemberTier } from '../constants/membership'
import { formatPrice } from '../utils/timeSlots'
import MembershipTiers from '../components/MembershipTiers.vue'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const auth = useAuthStore()

const barbers = computed(() => db.getBarbers().slice(0, 3))
const services = computed(() => db.getServices().slice(0, 3))
const currentTier = computed(() => getMemberTier(auth.user?.completedBookings ?? 0))

function goBook() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: '/book' } })
    return
  }
  router.push('/book')
}
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-content">
        <span class="hero-badge">Premium Barber Experience</span>
        <h1 class="hero-title">Koko Barber</h1>
        <p class="hero-desc">
          Gaya rapi, pelayanan profesional. Booking mudah, bayar instan, dan naik tier untuk benefit eksklusif!
        </p>
        <button class="btn btn-accent hero-cta" @click="goBook">
          <AppIcon icon="mdi:calendar-plus" :size="18" />
          Booking Sekarang
        </button>
      </div>
      <div class="hero-visual">
        <div class="hero-circle">
          <AppIcon icon="mdi:content-cut" :size="40" color="var(--accent-light)" />
        </div>
      </div>
    </section>

    <section v-if="auth.isLoggedIn" class="membership-banner card">
      <div class="tier-current">
        <AppIcon :icon="currentTier.icon" :size="28" :color="currentTier.color" />
        <div>
          <span class="badge badge-member">{{ currentTier.name }} Member</span>
          <p v-if="auth.isMember">
            Anda mendapat diskon <strong>50%</strong> untuk setiap booking!
          </p>
          <p v-else>
            <strong>{{ auth.bookingsUntilMember }}</strong> kunjungan lagi ke tier Platinum
          </p>
        </div>
      </div>
      <div v-if="!auth.isMember" class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(auth.user.completedBookings / 10) * 100}%` }"
        />
      </div>
    </section>

    <MembershipTiers />

    <section class="section">
      <h2 class="section-title">
        <AppIcon icon="mdi:account-group" :size="20" />
        Barber Terbaik
      </h2>
      <div class="barber-scroll">
        <div v-for="barber in barbers" :key="barber.id" class="barber-card card">
          <img :src="barber.avatar" :alt="barber.name" class="barber-img" />
          <h3>{{ barber.name }}</h3>
          <p class="barber-spec">{{ barber.specialty }}</p>
          <div class="barber-meta">
            <span>
              <AppIcon icon="mdi:star" :size="14" color="var(--accent)" />
              {{ barber.rating }}
            </span>
            <span>{{ barber.experience }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">
        <AppIcon icon="mdi:scissors-cutting" :size="20" />
        Layanan Populer
      </h2>
      <div class="service-list">
        <div v-for="service in services" :key="service.id" class="service-item card">
          <AppIcon :icon="service.icon" :size="28" class="service-icon" color="var(--primary)" />
          <div class="service-info">
            <h3>{{ service.name }}</h3>
            <p>{{ service.description }}</p>
          </div>
          <span class="service-price">{{ formatPrice(service.price) }}</span>
        </div>
      </div>
    </section>

    <section class="info-card card">
      <h3>
        <AppIcon icon="mdi:clock-outline" :size="20" />
        Jam Operasional
      </h3>
      <p>Setiap hari, 10:00 – 22:00 WIB</p>
      <p class="info-note">Sesi booking per 30 menit</p>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: var(--radius-lg);
  color: #fff;
  overflow: hidden;
}

.hero-badge {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  background: rgba(184, 139, 0, 0.3);
  color: var(--accent-light);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  margin-bottom: 0.5rem;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 0.5rem;
}

.hero-desc {
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.hero-cta {
  width: auto;
  padding: 0.65rem 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.hero-visual {
  flex-shrink: 0;
}

.hero-circle {
  width: 80px;
  height: 80px;
  background: rgba(184, 139, 0, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.membership-banner {
  margin-bottom: 1.5rem;
  border-left: 4px solid var(--accent);
}

.tier-current {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tier-current p {
  font-size: 0.9rem;
  margin-top: 0.35rem;
  color: var(--text-muted);
}

.progress-bar {
  height: 8px;
  background: var(--border);
  border-radius: 999px;
  margin-top: 0.75rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--accent-light));
  border-radius: 999px;
  transition: width 0.3s;
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.barber-scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scroll-snap-type: x mandatory;
}

.barber-card {
  min-width: 160px;
  scroll-snap-align: start;
  text-align: center;
}

.barber-img {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin: 0 auto 0.5rem;
  border: 2px solid var(--accent);
}

.barber-card h3 {
  font-size: 0.9rem;
  color: var(--primary);
}

.barber-spec {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0.25rem 0;
}

.barber-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--accent-dark);
}

.barber-meta span {
  display: flex;
  align-items: center;
  gap: 0.15rem;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.service-icon {
  flex-shrink: 0;
}

.service-info {
  flex: 1;
  min-width: 0;
}

.service-info h3 {
  font-size: 0.95rem;
  color: var(--primary);
}

.service-info p {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.service-price {
  font-weight: 700;
  color: var(--accent-dark);
  font-size: 0.9rem;
  white-space: nowrap;
}

.info-card h3 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--primary);
  margin-bottom: 0.35rem;
}

.info-card p {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.info-note {
  font-size: 0.8rem !important;
  margin-top: 0.25rem;
}
</style>

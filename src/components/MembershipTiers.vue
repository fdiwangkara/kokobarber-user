<script setup>
import { computed } from 'vue'
import { MEMBERSHIP_TIERS, getMemberTier, getNextTier } from '../constants/membership'
import { useAuthStore } from '../stores/auth'
import AppIcon from './AppIcon.vue'

defineProps({
  compact: { type: Boolean, default: false },
})

const auth = useAuthStore()

const visits = computed(() => auth.user?.completedBookings ?? 0)
const currentTier = computed(() => getMemberTier(visits.value))
const nextTier = computed(() => getNextTier(visits.value))

function isActive(tier) {
  return tier.id === currentTier.value.id
}

function isUnlocked(tier) {
  return visits.value >= tier.minVisits
}

function isLocked(tier) {
  return !isUnlocked(tier)
}

function tierProgress(tier) {
  if (isUnlocked(tier)) return 100
  if (tier.minVisits === 0) return 100
  return Math.min(100, Math.round((visits.value / tier.minVisits) * 100))
}

function tierProgressLabel(tier) {
  if (isUnlocked(tier)) return 'Terbuka'
  return `${visits.value}/${tier.minVisits} kunjungan`
}

function progressToNext() {
  if (!nextTier.value) return 100
  const prevMin = currentTier.value.minVisits
  const nextMin = nextTier.value.minVisits
  return Math.min(100, ((visits.value - prevMin) / (nextMin - prevMin)) * 100)
}

const stepperProgress = computed(() => {
  const lastTier = MEMBERSHIP_TIERS[MEMBERSHIP_TIERS.length - 1]
  if (visits.value >= lastTier.minVisits) return 100
  const segments = MEMBERSHIP_TIERS.length - 1
  let filled = 0
  for (let i = 0; i < MEMBERSHIP_TIERS.length - 1; i++) {
    const start = MEMBERSHIP_TIERS[i].minVisits
    const end = MEMBERSHIP_TIERS[i + 1].minVisits
    if (visits.value >= end) {
      filled += 1
    } else if (visits.value > start) {
      filled += (visits.value - start) / (end - start)
      break
    } else {
      break
    }
  }
  return (filled / segments) * 100
})
</script>

<template>
  <section class="tiers-section">
    <div class="tiers-header">
      <h2 class="section-title">
        <AppIcon icon="mdi:crown-outline" :size="20" />
        Tier Membership
      </h2>
      <p v-if="auth.isLoggedIn" class="tiers-subtitle">
        Tier Anda:
        <strong :style="{ color: currentTier.color }">{{ currentTier.name }}</strong>
        <span v-if="nextTier"> · {{ nextTier.minVisits - visits }} lagi ke {{ nextTier.name }}</span>
        <span v-else> · Tier tertinggi!</span>
      </p>
      <p v-else class="tiers-subtitle">Daftar dan kumpulkan kunjungan untuk membuka tier</p>
    </div>

    <!-- Stepper progress keseluruhan -->
    <div class="tier-stepper card">
      <div class="stepper-track">
        <div class="stepper-fill" :style="{ width: `${stepperProgress}%` }" />
      </div>
      <div class="stepper-nodes">
        <div
          v-for="(tier, index) in MEMBERSHIP_TIERS"
          :key="tier.id"
          class="stepper-node"
          :class="{
            unlocked: isUnlocked(tier),
            active: isActive(tier),
            locked: isLocked(tier),
          }"
        >
          <div class="node-circle" :style="{ borderColor: isUnlocked(tier) ? tier.color : 'var(--border)' }">
            <AppIcon
              v-if="isLocked(tier)"
              icon="mdi:lock"
              :size="14"
              color="var(--text-muted)"
            />
            <AppIcon
              v-else
              :icon="tier.icon"
              :size="16"
              :color="tier.color"
            />
          </div>
          <span class="node-label" :style="isActive(tier) ? { color: tier.color, fontWeight: 700 } : {}">
            {{ tier.name }}
          </span>
          <span v-if="index < MEMBERSHIP_TIERS.length - 1" class="node-connector" />
        </div>
      </div>
    </div>

    <!-- Progress ke tier berikutnya -->
    <div v-if="auth.isLoggedIn && nextTier" class="tier-progress card">
      <div class="tier-progress-top">
        <span class="progress-heading">
          <AppIcon icon="mdi:chart-line" :size="18" color="var(--accent)" />
          Progress ke {{ nextTier.name }}
        </span>
        <span class="progress-percent">{{ Math.round(progressToNext()) }}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressToNext()}%` }" />
      </div>
      <div class="tier-progress-labels">
        <span>{{ currentTier.name }} ({{ visits }} kunjungan)</span>
        <span>{{ nextTier.minVisits }} kunjungan</span>
      </div>
    </div>

    <div v-else-if="auth.isLoggedIn && !nextTier" class="tier-max card">
      <AppIcon icon="mdi:crown" :size="28" color="var(--accent)" />
      <p>Anda sudah di tier <strong>Platinum</strong> — benefit maksimal aktif!</p>
    </div>

    <!-- Kartu tier -->
    <div class="tiers-grid" :class="{ compact }">
      <div
        v-for="tier in MEMBERSHIP_TIERS"
        :key="tier.id"
        class="tier-card card"
        :class="{
          active: isActive(tier),
          unlocked: isUnlocked(tier),
          locked: isLocked(tier),
        }"
      >
        <!-- Overlay lock -->
        <div v-if="isLocked(tier)" class="tier-lock-overlay">
          <div class="lock-badge">
            <AppIcon icon="mdi:lock" :size="compact ? 28 : 36" color="#fff" />
            <span>Terkunci</span>
          </div>
        </div>

        <div class="tier-icon" :style="{ background: `${tier.color}18`, color: tier.color }">
          <AppIcon :icon="tier.icon" :size="compact ? 24 : 28" />
        </div>

        <h3 :style="{ color: tier.color }">{{ tier.name }}</h3>
        <p class="tier-range">
          {{ tier.minVisits }}{{ tier.maxVisits === Infinity ? '+' : `–${tier.maxVisits}` }} kunjungan
        </p>

        <!-- Progress per tier -->
        <div class="tier-card-progress">
          <div class="tier-card-progress-bar">
            <div
              class="tier-card-progress-fill"
              :style="{
                width: `${tierProgress(tier)}%`,
                background: isUnlocked(tier) ? tier.color : 'var(--border)',
              }"
            />
          </div>
          <span class="tier-card-progress-text" :class="{ unlocked: isUnlocked(tier) }">
            <AppIcon
              v-if="isUnlocked(tier)"
              icon="mdi:check-circle"
              :size="12"
              :color="tier.color"
            />
            <AppIcon v-else icon="mdi:lock-outline" :size="12" />
            {{ tierProgressLabel(tier) }}
          </span>
        </div>

        <ul v-if="!compact" class="tier-benefits">
          <li v-for="(benefit, i) in tier.benefits" :key="i">
            <AppIcon
              :icon="isUnlocked(tier) ? 'mdi:check' : 'mdi:lock-outline'"
              :size="14"
              :color="isUnlocked(tier) ? 'var(--success)' : 'var(--text-muted)'"
            />
            <span :class="{ 'benefit-locked': isLocked(tier) }">{{ benefit }}</span>
          </li>
        </ul>

        <span v-if="isActive(tier)" class="tier-badge">Tier Anda</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tiers-section {
  margin-bottom: 1.5rem;
}

.tiers-header .section-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.tiers-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

/* Stepper */
.tier-stepper {
  padding: 1rem 0.75rem 0.75rem;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.stepper-track {
  position: relative;
  height: 4px;
  background: var(--border);
  border-radius: 999px;
  margin: 0 1.25rem 1.75rem;
}

.stepper-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 999px;
  transition: width 0.4s ease;
}

.stepper-nodes {
  display: flex;
  justify-content: space-between;
  margin-top: -2.35rem;
  padding: 0 0.25rem;
}

.stepper-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  min-width: 0;
}

.node-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: all 0.2s;
}

.stepper-node.unlocked .node-circle {
  background: var(--bg-card);
  box-shadow: 0 2px 8px rgba(86, 1, 26, 0.1);
}

.stepper-node.active .node-circle {
  box-shadow: 0 0 0 3px rgba(184, 139, 0, 0.25);
  transform: scale(1.1);
}

.stepper-node.locked .node-circle {
  background: var(--bg);
}

.node-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 0.35rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Progress card */
.tier-progress {
  margin-bottom: 0.75rem;
  padding: 1rem;
}

.tier-progress-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-heading {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary);
}

.progress-percent {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent-dark);
}

.progress-bar {
  height: 10px;
  background: var(--border);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 999px;
  transition: width 0.4s ease;
}

.tier-progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.4rem;
}

.tier-max {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, rgba(86, 1, 26, 0.06), rgba(184, 139, 0, 0.1));
  border-left: 4px solid var(--accent);
}

.tier-max p {
  font-size: 0.9rem;
  color: var(--text-muted);
}

/* Tier cards */
.tiers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.tiers-grid.compact .tier-card {
  padding: 0.85rem;
}

.tier-card {
  position: relative;
  text-align: center;
  padding: 1rem;
  border: 2px solid transparent;
  transition: border-color 0.2s, filter 0.2s;
  overflow: hidden;
}

.tier-card.unlocked {
  border-color: var(--border);
}

.tier-card.locked {
  border-color: var(--border);
}

.tier-card.locked .tier-icon,
.tier-card.locked h3,
.tier-card.locked .tier-range,
.tier-card.locked .tier-benefits {
  filter: grayscale(0.6);
  opacity: 0.55;
}

.tier-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(184, 139, 0, 0.15);
}

.tier-card.active.locked {
  filter: none;
}

/* Lock overlay */
.tier-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 26, 26, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  border-radius: inherit;
}

.lock-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  background: rgba(86, 1, 26, 0.85);
  padding: 0.65rem 1rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
}

.lock-badge span {
  font-size: 0.7rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.tier-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  position: relative;
  z-index: 0;
}

.tier-card h3 {
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
  position: relative;
  z-index: 0;
}

.tier-range {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.tier-card-progress {
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 3;
}

.tier-card.locked .tier-card-progress {
  filter: none;
  opacity: 1;
}

.tier-card-progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.3rem;
}

.tier-card.unlocked .tier-card-progress-bar {
  background: var(--border);
}

.tier-card-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.tier-card.locked .tier-card-progress-fill {
  background: var(--accent-light) !important;
}

.tier-card-progress-text {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
}

.tier-card-progress-text.unlocked {
  color: var(--success);
}

.tier-card.locked .tier-card-progress-text {
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}

.tier-benefits {
  list-style: none;
  text-align: left;
  font-size: 0.75rem;
  color: var(--text-muted);
  position: relative;
  z-index: 0;
}

.tier-benefits li {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin-bottom: 0.25rem;
}

.benefit-locked {
  opacity: 0.7;
}

.tier-badge {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  position: relative;
  z-index: 3;
}

@media (min-width: 640px) {
  .tiers-grid:not(.compact) {
    grid-template-columns: repeat(4, 1fr);
  }

  .node-label {
    font-size: 0.7rem;
  }
}
</style>

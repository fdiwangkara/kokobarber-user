<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAlertStore } from '../stores/alert'
import AppIcon from '../components/AppIcon.vue'
import AppAlert from '../components/AppAlert.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const alert = useAlertStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    auth.login(email.value, password.value)
    alert.success('Selamat datang kembali!')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function fillDemo() {
  email.value = 'demo@kokobarber.com'
  password.value = 'demo123'
  alert.info('Akun demo telah diisi. Klik Masuk untuk melanjutkan.')
}
</script>

<template>
  <div class="page page--no-nav auth-page">
    <div class="auth-card card">
      <div class="auth-header">
        <AppIcon icon="mdi:content-cut" :size="48" color="var(--primary)" />
        <h1 class="page-title">Masuk</h1>
        <p class="page-subtitle">Selamat datang kembali di Koko Barber</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-input"
            placeholder="nama@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
          />
        </div>

        <AppAlert v-if="error" type="error" :message="error" />

        <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
          <AppIcon v-if="loading" icon="mdi:loading" :size="18" class="spin" />
          <AppIcon v-else icon="mdi:login" :size="18" />
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <button type="button" class="btn btn-ghost demo-btn" @click="fillDemo">
        <AppIcon icon="mdi:account-key" :size="16" />
        Gunakan akun demo
      </button>

      <p class="auth-footer">
        Belum punya akun?
        <router-link to="/register">Daftar sekarang</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2rem 1.5rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.demo-btn {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

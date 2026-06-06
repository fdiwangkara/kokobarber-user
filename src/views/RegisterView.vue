<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAlertStore } from '../stores/alert'
import AppIcon from '../components/AppIcon.vue'
import AppAlert from '../components/AppAlert.vue'

const router = useRouter()
const auth = useAuthStore()
const alert = useAlertStore()

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})
const error = ref('')
const loading = ref(false)

function handleRegister() {
  error.value = ''
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Password tidak cocok'
    return
  }
  if (form.value.password.length < 6) {
    error.value = 'Password minimal 6 karakter'
    return
  }

  loading.value = true
  try {
    auth.register({
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      password: form.value.password,
    })
    alert.success('Registrasi berhasil! Selamat bergabung di Koko Barber.')
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page page--no-nav auth-page">
    <div class="auth-card card">
      <div class="auth-header">
        <AppIcon icon="mdi:content-cut" :size="48" color="var(--primary)" />
        <h1 class="page-title">Daftar</h1>
        <p class="page-subtitle">Gabung membership Koko Barber</p>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label" for="name">Nama Lengkap</label>
          <input id="name" v-model="form.name" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input id="email" v-model="form.email" type="email" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="phone">No. Telepon</label>
          <input id="phone" v-model="form.phone" type="tel" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input id="password" v-model="form.password" type="password" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label" for="confirm">Konfirmasi Password</label>
          <input id="confirm" v-model="form.confirmPassword" type="password" class="form-input" required />
        </div>

        <AppAlert v-if="error" type="error" :message="error" />

        <button type="submit" class="btn btn-primary submit-btn" :disabled="loading">
          <AppIcon v-if="loading" icon="mdi:loading" :size="18" class="spin" />
          <AppIcon v-else icon="mdi:account-plus" :size="18" />
          {{ loading ? 'Memproses...' : 'Daftar' }}
        </button>
      </form>

      <p class="auth-footer">
        Sudah punya akun?
        <router-link to="/login">Masuk</router-link>
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

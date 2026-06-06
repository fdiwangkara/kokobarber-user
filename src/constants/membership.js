export const MEMBERSHIP_TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    minVisits: 0,
    maxVisits: 2,
    icon: 'mdi:account-outline',
    color: '#8B7355',
    benefits: ['Akses booking online', 'Riwayat transaksi', 'Notifikasi jadwal'],
  },
  {
    id: 'silver',
    name: 'Silver',
    minVisits: 3,
    maxVisits: 5,
    icon: 'mdi:medal-outline',
    color: '#9E9E9E',
    benefits: ['Semua benefit Starter', 'Prioritas slot weekend', 'Badge Silver di profil'],
  },
  {
    id: 'gold',
    name: 'Gold',
    minVisits: 6,
    maxVisits: 9,
    icon: 'mdi:medal',
    color: '#B88B00',
    benefits: ['Semua benefit Silver', 'Diskon 10% per booking', 'Akses barber premium'],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minVisits: 10,
    maxVisits: Infinity,
    icon: 'mdi:crown',
    color: '#56011A',
    benefits: ['Semua benefit Gold', 'Diskon 50% permanen', 'Prioritas antrian tertinggi'],
  },
]

export const CANCEL_REASONS = [
  { value: 'schedule_conflict', label: 'Bentrok jadwal' },
  { value: 'change_barber', label: 'Ingin ganti barber' },
  { value: 'change_service', label: 'Ingin ganti layanan' },
  { value: 'emergency', label: 'Keadaan darurat' },
  { value: 'other', label: 'Lainnya' },
]

export function getMemberTier(completedBookings) {
  return (
    [...MEMBERSHIP_TIERS]
      .reverse()
      .find((tier) => completedBookings >= tier.minVisits) ?? MEMBERSHIP_TIERS[0]
  )
}

export function getNextTier(completedBookings) {
  return MEMBERSHIP_TIERS.find((tier) => completedBookings < tier.minVisits) ?? null
}

const MIN_CANCEL_HOURS = 2
const FULL_REFUND_HOURS = 24

export function getHoursUntilBooking(date, timeSlot) {
  const slotTime = new Date(`${date}T${timeSlot}:00`)
  return (slotTime - new Date()) / (1000 * 60 * 60)
}

export function canCancelBooking(booking) {
  if (booking.status !== 'upcoming') {
    return {
      allowed: false,
      reason: booking.status === 'ongoing'
        ? 'Booking sedang berlangsung dan tidak dapat dibatalkan.'
        : booking.status === 'completed'
          ? 'Booking sudah selesai.'
          : 'Booking ini sudah dibatalkan sebelumnya.',
    }
  }

  const hoursLeft = getHoursUntilBooking(booking.date, booking.timeSlot)
  if (hoursLeft < MIN_CANCEL_HOURS) {
    return {
      allowed: false,
      reason: `Pembatalan hanya dapat dilakukan minimal ${MIN_CANCEL_HOURS} jam sebelum jadwal.`,
    }
  }

  return { allowed: true, hoursLeft }
}

export function getRefundInfo(booking) {
  const hoursLeft = getHoursUntilBooking(booking.date, booking.timeSlot)

  if (hoursLeft >= FULL_REFUND_HOURS) {
    return {
      percent: 100,
      amount: booking.finalPrice,
      label: 'Refund penuh',
      description: 'Dikembalikan 100% karena pembatalan lebih dari 24 jam sebelum jadwal.',
    }
  }

  if (hoursLeft >= MIN_CANCEL_HOURS) {
    const amount = Math.round(booking.finalPrice * 0.5)
    return {
      percent: 50,
      amount,
      label: 'Refund 50%',
      description: 'Dikembalikan 50% karena pembatalan antara 2–24 jam sebelum jadwal.',
    }
  }

  return {
    percent: 0,
    amount: 0,
    label: 'Tidak ada refund',
    description: 'Pembatalan kurang dari 2 jam sebelum jadwal tidak mendapat refund.',
  }
}

export function getCancelReasonLabel(value) {
  const labels = {
    schedule_conflict: 'Bentrok jadwal',
    change_barber: 'Ingin ganti barber',
    change_service: 'Ingin ganti layanan',
    emergency: 'Keadaan darurat',
    other: 'Lainnya',
  }
  return labels[value] ?? value
}

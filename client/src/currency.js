const soles = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

export const money = amount => soles.format(amount)

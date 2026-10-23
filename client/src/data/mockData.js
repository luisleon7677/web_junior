// Shared mock data store for the app
export const CATEGORIES = ['Shampoo', 'Cera / Pomada', 'Navaja / Hojas', 'Crema', 'Toalla', 'Colonia', 'Otro']

export const initialProducts = [
  { id: 1, name: 'Shampoo Revlon', category: 'Shampoo', stock: 24, price: 85, minStock: 5 },
  { id: 2, name: 'Pomada Gatsby', category: 'Cera / Pomada', stock: 8, price: 120, minStock: 10 },
  { id: 3, name: 'Hojas Gillette x10', category: 'Navaja / Hojas', stock: 60, price: 35, minStock: 20 },
  { id: 4, name: 'Crema Afeitado Nivea', category: 'Crema', stock: 3, price: 95, minStock: 5 },
  { id: 5, name: 'Toalla Microfibra', category: 'Toalla', stock: 15, price: 45, minStock: 8 },
  { id: 6, name: 'Colonia Blue Fresh', category: 'Colonia', stock: 6, price: 200, minStock: 3 },
  { id: 7, name: 'Cera Mate American Crew', category: 'Cera / Pomada', stock: 12, price: 150, minStock: 5 },
  { id: 8, name: 'Shampoo OGX Coconut', category: 'Shampoo', stock: 0, price: 110, minStock: 5 },
]

export const monthlyData = [
  { month: 'May', entradas: 42, salidas: 30 },
  { month: 'Jun', entradas: 55, salidas: 38 },
  { month: 'Jul', entradas: 38, salidas: 45 },
  { month: 'Ago', entradas: 65, salidas: 50 },
  { month: 'Sep', entradas: 48, salidas: 42 },
  { month: 'Oct', entradas: 72, salidas: 58 },
]

export const recentMovements = [
  { id: 1, type: 'in', product: 'Pomada Gatsby', qty: 10, time: 'Hace 20 min' },
  { id: 2, type: 'out', product: 'Hojas Gillette x10', qty: 5, time: 'Hace 1 hora' },
  { id: 3, type: 'in', product: 'Shampoo Revlon', qty: 12, time: 'Hace 3 horas' },
  { id: 4, type: 'out', product: 'Crema Afeitado Nivea', qty: 2, time: 'Ayer 18:30' },
  { id: 5, type: 'in', product: 'Colonia Blue Fresh', qty: 6, time: 'Ayer 10:00' },
]

import { describe, it, expect } from 'vitest'
import { aggregateSalesAnalytics, TransactionOrder } from '@/lib/orderCalculation'

describe('Unit Test: Pengolahan & Agregasi Data Transaksi Penjualan', () => {
  it('harus mengembalikan nilai 0 saat daftar transaksi kosong (kondisi batas)', () => {
    const result = aggregateSalesAnalytics([])
    expect(result.totalPendapatan).toBe(0)
    expect(result.totalProdukTerjual).toBe(0)
    expect(result.totalTransaksi).toBe(0)
    expect(result.averageOrderValue).toBe(0)
    expect(result.productSales).toEqual([])
    expect(result.categorySales).toEqual([])
  })

  it('harus mengagregasi 1 pesanan dengan benar', () => {
    const orders: TransactionOrder[] = [
      {
        totalAmount: 40000,
        items: [
          {
            productId: 'p1',
            productName: 'Bakso Rusuk',
            categoryName: 'Bakso',
            quantity: 2,
            subtotal: 36000,
          },
          {
            productId: 'p2',
            productName: 'Es Teh Manis',
            categoryName: 'Minuman',
            quantity: 1,
            subtotal: 4000,
          },
        ],
      },
    ]

    const result = aggregateSalesAnalytics(orders)
    expect(result.totalPendapatan).toBe(40000)
    expect(result.totalProdukTerjual).toBe(3)
    expect(result.totalTransaksi).toBe(1)
    expect(result.averageOrderValue).toBe(40000)
    expect(result.productSales).toHaveLength(2)
    expect(result.categorySales).toHaveLength(2)
  })

  it('harus menggabungkan kuantitas dan total pendapatan produk yang sama dari beberapa transaksi', () => {
    const orders: TransactionOrder[] = [
      {
        totalAmount: 36000,
        items: [
          {
            productId: 'bakso-rusuk',
            productName: 'Bakso Rusuk',
            categoryName: 'Bakso',
            quantity: 2,
            subtotal: 36000,
          },
        ],
      },
      {
        totalAmount: 54000,
        items: [
          {
            productId: 'bakso-rusuk',
            productName: 'Bakso Rusuk',
            categoryName: 'Bakso',
            quantity: 3,
            subtotal: 54000,
          },
        ],
      },
    ]

    const result = aggregateSalesAnalytics(orders)
    expect(result.totalPendapatan).toBe(90000)
    expect(result.totalProdukTerjual).toBe(5)
    expect(result.totalTransaksi).toBe(2)
    expect(result.averageOrderValue).toBe(45000)

    expect(result.productSales).toHaveLength(1)
    expect(result.productSales[0]).toEqual({
      productId: 'bakso-rusuk',
      name: 'Bakso Rusuk',
      categoryName: 'Bakso',
      qty: 5,
      total: 90000,
    })
  })

  it('harus mengurutkan produk terlaris berdasarkan kuantitas terbanyak secara descending', () => {
    const orders: TransactionOrder[] = [
      {
        totalAmount: 50000,
        items: [
          {
            productId: 'p-urat',
            productName: 'Bakso Urat',
            categoryName: 'Bakso',
            quantity: 1,
            subtotal: 12000,
          },
          {
            productId: 'p-teh',
            productName: 'Es Teh Manis',
            categoryName: 'Minuman',
            quantity: 5, // Terbanyak kuantitasnya
            subtotal: 20000,
          },
          {
            productId: 'p-rusuk',
            productName: 'Bakso Rusuk',
            categoryName: 'Bakso',
            quantity: 1,
            subtotal: 18000,
          },
        ],
      },
    ]

    const result = aggregateSalesAnalytics(orders)
    expect(result.productSales[0].productId).toBe('p-teh')
    expect(result.productSales[0].qty).toBe(5)
  })

  it('harus mengurutkan kategori penjualan berdasarkan total omzet tertinggi secara descending', () => {
    const orders: TransactionOrder[] = [
      {
        totalAmount: 52000,
        items: [
          {
            productId: 'p1',
            productName: 'Es Teh Manis',
            categoryName: 'Minuman',
            quantity: 3,
            subtotal: 12000,
          },
          {
            productId: 'p2',
            productName: 'Bakso Mercon + Telor',
            categoryName: 'Bakso',
            quantity: 2,
            subtotal: 36000, // Total omzet kategori Bakso lebih tinggi
          },
          {
            productId: 'p3',
            productName: 'Kerupuk',
            categoryName: 'Tambahan',
            quantity: 2,
            subtotal: 4000,
          },
        ],
      },
    ]

    const result = aggregateSalesAnalytics(orders)
    expect(result.categorySales[0].name).toBe('Bakso')
    expect(result.categorySales[0].total).toBe(36000)
    expect(result.categorySales[1].name).toBe('Minuman')
    expect(result.categorySales[1].total).toBe(12000)
    expect(result.categorySales[2].name).toBe('Tambahan')
    expect(result.categorySales[2].total).toBe(4000)
  })
})


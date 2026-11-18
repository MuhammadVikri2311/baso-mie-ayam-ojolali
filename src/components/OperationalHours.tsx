'use client'

import { useSyncExternalStore } from 'react'
import { Clock } from 'lucide-react'

interface ScheduleDay {
  dayIndex: number // 0 = Minggu, 1 = Senin, ...
  dayName: string
  openTime: string
  closeTime: string
  openMinute: number
  closeMinute: number
}

const SCHEDULE: ScheduleDay[] = [
  { dayIndex: 1, dayName: 'Senin', openTime: '10.00', closeTime: '21.00', openMinute: 10 * 60, closeMinute: 21 * 60 },
  { dayIndex: 2, dayName: 'Selasa', openTime: '10.00', closeTime: '21.00', openMinute: 10 * 60, closeMinute: 21 * 60 },
  { dayIndex: 3, dayName: 'Rabu', openTime: '10.00', closeTime: '21.00', openMinute: 10 * 60, closeMinute: 21 * 60 },
  { dayIndex: 4, dayName: 'Kamis', openTime: '10.00', closeTime: '21.00', openMinute: 10 * 60, closeMinute: 21 * 60 },
  { dayIndex: 5, dayName: 'Jumat', openTime: '10.00', closeTime: '21.00', openMinute: 10 * 60, closeMinute: 21 * 60 },
  { dayIndex: 6, dayName: 'Sabtu', openTime: '10.00', closeTime: '21.00', openMinute: 10 * 60, closeMinute: 21 * 60 },
  { dayIndex: 0, dayName: 'Minggu', openTime: '10.00', closeTime: '20.00', openMinute: 10 * 60, closeMinute: 20 * 60 },
]

function getWibData() {
  const now = new Date()
  const wibString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  const wibDate = new Date(wibString)

  const day = wibDate.getDay() // 0 = Minggu, 1 = Senin, ...
  const hours = wibDate.getHours()
  const minutes = wibDate.getMinutes()
  const currentMinutes = hours * 60 + minutes

  const todaySchedule = SCHEDULE.find((s) => s.dayIndex === day) || SCHEDULE[0]
  const isOpen = currentMinutes >= todaySchedule.openMinute && currentMinutes < todaySchedule.closeMinute
  const timeDisplay = `${String(hours).padStart(2, '0')}.${String(minutes).padStart(2, '0')} WIB`

  return {
    isOpen,
    currentDayIndex: day,
    timeDisplay,
    todaySchedule,
  }
}

// Store eksternal untuk sinkronisasi waktu WIB secara reaktif dan aman dari hydration error
let currentWibSnapshot = typeof window !== 'undefined' ? getWibData() : null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  setInterval(() => {
    currentWibSnapshot = getWibData()
    listeners.forEach((callback) => callback())
  }, 30000)
}

function subscribeWib(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function OperationalHours() {
  const wibState = useSyncExternalStore(
    subscribeWib,
    () => currentWibSnapshot,
    () => null
  )

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm mb-1">
            <Clock className="w-4 h-4" />
            <span>Jadwal Buka</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
            Jam Operasional Kedai
          </h3>
          <p className="text-sm text-stone-500 mt-0.5">
            Waktu Indonesia Barat (WIB)
          </p>
        </div>

        {/* Status Real-time WIB */}
        {wibState && (
          <div
            className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
              wibState.isOpen
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <span className="relative flex h-3 w-3">
              {wibState.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  wibState.isOpen ? 'bg-emerald-500' : 'bg-stone-400'
                }`}
              ></span>
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span>{wibState.isOpen ? 'Buka Sekarang' : 'Sedang Tutup'}</span>
              </div>
              <p className="text-xs font-normal opacity-80">
                {wibState.isOpen
                  ? `Buka s/d ${wibState.todaySchedule.closeTime} WIB (${wibState.timeDisplay})`
                  : `Buka kembali pukul 10.00 WIB (${wibState.timeDisplay})`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid Jadwal Hari */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {SCHEDULE.map((item) => {
          const isToday = wibState?.currentDayIndex === item.dayIndex

          return (
            <div
              key={item.dayName}
              className={`p-4 rounded-2xl transition-all duration-200 border ${
                isToday
                  ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/30 shadow-sm'
                  : 'bg-stone-50/60 border-stone-100 hover:border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-bold ${
                    isToday ? 'text-orange-700' : 'text-stone-800'
                  }`}
                >
                  {item.dayName}
                </span>
                {isToday && (
                  <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Hari Ini
                  </span>
                )}
              </div>
              <div className="text-stone-700 font-semibold text-sm">
                {item.openTime}–{item.closeTime}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">
                WIB
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
        <span>Melayani santap di tempat (dine-in) dan bungkus (takeaway).</span>
        <span className="text-orange-600 font-medium">Buka setiap hari</span>
      </div>
    </div>
  )
}

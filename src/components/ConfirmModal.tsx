'use client'

import React from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'

export interface ConfirmModalProps {
  isOpen: boolean
  orderNumber?: string | null
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  isOpen,
  orderNumber,
  title = 'Selesaikan Pesanan?',
  description,
  confirmText = 'Ya, Selesaikan',
  cancelText = 'Batal',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={!isLoading ? onClose : undefined}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition disabled:opacity-50 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
          {title}
        </h3>

        <div className="mt-2 text-sm text-stone-500 leading-relaxed">
          {description ? (
            <p>{description}</p>
          ) : (
            <p>
              Apakah Anda yakin ingin menyelesaikan pesanan{' '}
              {orderNumber && (
                <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                  #{orderNumber}
                </span>
              )}
              ? Status pesanan akan diubah menjadi{' '}
              <span className="font-bold text-emerald-600">SELESAI</span> dan pembayaran tercatat lunas.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/20 hover:shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

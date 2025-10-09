'use client'

import Link from 'next/link'
import { ExternalLink, Edit, Share2 } from 'lucide-react'

interface LinkCardActionsProps {
  linkId: string
  linkName: string
  bookingUrl: string
  bookingsCount: number
}

export function LinkCardActions({ linkId, linkName, bookingUrl, bookingsCount }: LinkCardActionsProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: linkName,
          text: `Agenda tu cita: ${linkName}`,
          url: bookingUrl,
        })
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed')
      }
    }
  }

  return (
    <>
      {/* Stats */}
      <div className="text-sm text-gray-600 pb-3 border-b border-gray-100">
        <span className="font-medium text-gray-900">{bookingsCount}</span> reservas
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
        
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir
        </a>
        
        <Link
          href={`/dashboard/links/${linkId}/edit`}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>
    </>
  )
}

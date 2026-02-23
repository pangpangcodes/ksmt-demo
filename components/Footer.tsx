'use client'

import { useState } from 'react'
import { Heart, Mail, Phone, X } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <>
      <footer className="bg-gray-900 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 text-accent-400" fill="currentColor" />
              <p className="font-display">Bella & Edward</p>
            </div>

            <p className="text-sm text-gray-400">
              September 20-22, 2026 • <a
                href="https://maps.app.goo.gl/WiS5wuaKHpYuXRky6"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline"
              >
                Hacienda de los Naranjos
              </a> • Seville, Spain
            </p>

            <div className="flex items-center justify-center gap-2">
              <p className="text-xs text-gray-500">Made with love by ksmt</p>
              <Image
                src="/ksmt-logo.svg"
                alt="ksmt"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
        </div>
      </div>
    </footer>

    {/* Contact Modal */}
    {showContactModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={() => setShowContactModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <h3 className="font-display text-2xl font-bold text-gray-900 mb-6">Contact Us</h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <Phone className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Bella</h4>
                <a
                  href="tel:5551234567"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  (555) 123-4567
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <Phone className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Edward</h4>
                <a
                  href="tel:5559876543"
                  className="text-primary-600 hover:text-primary-700 transition-colors"
                >
                  (555) 987-6543
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}


'use client'

import { Hotel, Bed, Wifi, Car, MapPin, Phone } from 'lucide-react'

export default function Accommodation() {
  return (
    <section id="accommodation" className="py-3 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4 md:mb-8">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Accommodation
            </h2>
            <p className="text-lg text-gray-600">
              Where you&apos;ll stay during our celebration
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-md p-4 md:p-6 border border-primary-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <Hotel className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">Our Venue</h3>
              </div>
            </div>
            <div className="md:ml-14">
              <p className="text-gray-600 mb-4">
                We appreciate you coming and have hand-picked a venue that can house most, <i>if not all</i>, of our guests for all 3 nights. If you won&apos;t be joining us for all 3 nights, please let us know so we can plan accordingly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Bed className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <h4 className="font-bold text-gray-900">Rooms</h4>
                </div>
                <ul className="space-y-2 text-gray-600 text-sm mb-3 list-disc pl-5">
                  <li className="pl-1">Private rooms with ensuite baths</li>
                  <li className="pl-1">Breakfast facilities</li>
                  <li className="pl-1">Dining area/kitchenette (depending on room)</li>
                  <li className="pl-1">Terrace</li>
                </ul>
                <p className="text-gray-600 text-sm">
                  Bella and Edward will be carefully making room arrangements for all of our guests.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Wifi className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <h4 className="font-bold text-gray-900">Amenities</h4>
                </div>
                <ul className="space-y-2 text-gray-600 text-sm list-disc pl-5">
                  <li className="pl-1">WiFi</li>
                  <li className="pl-1">AC</li>
                  <li className="pl-1">Pool access</li>
                  <li className="pl-1">Bedding and towels for bathroom and pool</li>
                  <li className="pl-1">Hair dryer</li>
                  <li className="pl-1">Safe</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-md p-4 md:p-6 border border-primary-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">Venue Information</h3>
              </div>
            </div>

            <div className="space-y-4 md:ml-14">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Venue Location</h4>
                  <p className="text-gray-600">
                    <a
                      href="https://maps.app.goo.gl/WiS5wuaKHpYuXRky6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary-600 transition-colors"
                    >
                      Hacienda de los Naranjos
                    </a>, Seville, Spain
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Car className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Parking</h4>
                  <p className="text-gray-600">Complimentary parking available on-site</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Questions?</h4>
                  <p className="text-gray-600">
                    If you have any questions about accommodation, please reach out to us directly.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> We&apos;ll be making room arrangements in 2026 and will let you know accommodation plans ahead of time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Phone, X } from 'lucide-react'

const faqs = [
  {
    question: 'What is the dress code?',
    answer: 'We\'d love to see our guests dressed in cocktail attire on our wedding day. Think elegant but comfortable - you\'ll want to dance the night away under the Andalusian stars! For the welcome reception, casual elegance is perfect.',
  },
  {
    question: 'Can I bring a plus one?',
    answer: 'Please check your invitation for plus one details. If you have any questions, feel free to reach out to us directly.',
  },
  {
    question: 'Are kids welcome?',
    answer: 'Yes! We welcome your little ones at our celebration. The hacienda has spacious grounds perfect for children to play safely.',
  },
  {
    question: 'What if I have dietary restrictions?',
    answer: 'Please let us know about any dietary restrictions or allergies when you RSVP. Our caterer specializes in authentic Andalusian cuisine and can accommodate various dietary needs.',
  },
  {
    question: 'Will there be transportation provided?',
    answer: 'The hacienda has parking available, and we\'re happy to help coordinate transportation for our guests. If you need assistance with airport transfers from Seville Airport, please let us know.',
  },
  {
    question: 'What\'s the weather like in Seville in September?',
    answer: 'September in Seville is warm and pleasant, with average temperatures around 25-30°C during the day. Evenings are cooler and perfect for outdoor celebrations. We recommend bringing layers for the evening.',
  },
  {
    question: 'Are there rooms reserved at the venue?',
    answer: 'Yes! We have reserved accommodations at Hacienda de los Naranjos for our guests. This beautiful venue can house most of our guests for the weekend. Please let us know if you won\'t be staying all nights so we can plan accordingly.',
  },
  {
    question: 'What time should I arrive?',
    answer: 'We recommend arriving on September 20th during check-in time (2-5pm) to join us for the welcome reception and enjoy the stunning hacienda grounds.',
  },
  {
    question: 'What language is spoken?',
    answer: 'The staff at the venue speak both Spanish and English. Seville is a tourist-friendly city, so English is widely understood in most places.',
  },
  {
    question: 'Can I take photos during the ceremony?',
    answer: 'We\'d love an unplugged ceremony so you can be fully present with us in this magical moment. We have a professional photographer who will capture everything beautifully, and we\'ll share all photos with you after the wedding!',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <>
      <section id="faq" className="pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our celebration
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Still have questions? Don&apos;t hesitate to ask!
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="inline-block px-6 py-2 bg-green-200 text-gray-900 rounded-full font-semibold hover:bg-green-300 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </section>

    {/* Contact Modal */}
    {showContactModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
          <button
            onClick={() => setShowContactModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <h3 className="font-display text-2xl font-bold text-gray-900 mb-6">Contact Us</h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <Phone className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Monica</h4>
                <a
                  href="tel:6479735655"
                  className="text-primary-600 hover:text-primary-700 transition-colors block"
                >
                  (647) 973-5655
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-primary-50 rounded-lg">
              <Phone className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Kevin</h4>
                <a
                  href="tel:6476324688"
                  className="text-primary-600 hover:text-primary-700 transition-colors block"
                >
                  (647) 632-4688
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


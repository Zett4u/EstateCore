import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <section className="pt-16 pb-12 px-6 bg-stone-100/60 border-b border-stone-200/80">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs uppercase font-mono tracking-widest text-forest-700 font-semibold">
            Get in Touch
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
            Contact EstateCore
          </h1>
          <p className="text-base text-stone-600 max-w-xl mx-auto">
            Have questions regarding property listings, broker partnerships, or viewing tours? Our team is available.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Corporate Headquarters
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Centralized real estate operations for Metro Manila listings.
              </p>
            </div>

            <div className="space-y-5 text-sm text-stone-600">
              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Office Location</p>
                  <p className="text-xs text-stone-500">7th Avenue corner 28th Street, Bonifacio Global City, Taguig</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Electronic Mail</p>
                  <p className="text-xs text-stone-500">inquiries@estatecore.local</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Direct Telephone</p>
                  <p className="text-xs text-stone-500">+63 (2) 8888-CORE (2673)</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Viewing Hours</p>
                  <p className="text-xs text-stone-500">Monday — Saturday: 9:00 AM — 6:00 PM PHT</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200/90 shadow-subtle">
            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-forest-600 mx-auto" />
                <h3 className="font-bold text-lg text-stone-900 font-serif">Message Received</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Thank you for reaching out, {name}. A verified representative will reply to {email} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-bold text-stone-900 text-lg font-serif">Send General Inquiry</h3>
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-stone-50/50"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-stone-50/50"
                    placeholder="juan@example.local"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-500 mb-1">Inquiry Details</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-700 bg-stone-50/50"
                    placeholder="How can our real estate team assist you?"
                  ></textarea>
                </div>
                <Button type="submit" className="w-full bg-forest-700 hover:bg-forest-800 text-white">
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

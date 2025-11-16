import React from 'react';
import { Facebook, Instagram, Twitter, Apple } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";
const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Customer Service */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">CUSTOMER SERVICE</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Return Order</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Cancel Order</a></li>
            </ul>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm">15 Days Return Policy*</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm">Cash On Delivery*</span>
              </div>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">COMPANY</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-yellow-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">We are Hiring</a></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">CONNECT WITH US</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                <span className="text-sm">4.7M People like this</span>
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5" />
                <span className="text-sm">1M People like this</span>
              </div>
              <div className="flex gap-4 mt-4">
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                    <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.6 12.6l7.7-9h-1.8l-6.7 7.8-5.4-7.8H1l8.1 11.8L1 24h1.8l7.1-8.3 5.7 8.3H22l-8.4-11.4zM10.5 14l-.8-1.2L3.4 4.5h2.8l5.2 7.4.8 1.2 6.9 9.9h-2.8l-5.8-8z" />
                  </svg>
                </a>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  <Apple className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Download App */}
            <div className="mt-6">
              <h4 className="text-yellow-400 font-bold text-sm mb-3">DOWNLOAD THE APP</h4>
              <div className="flex gap-2">
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-10" />
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on App Store" className="h-10" />
                </a>
              </div>
            </div>
          </div>

          {/* Keep Up To Date */}
          <div>
            <h3 className="text-yellow-400 font-bold text-lg mb-4">KEEP UP TO DATE</h3>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter Email Id:"
                className="flex-1 px-4 py-2 bg-transparent border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              <button className="bg-yellow-400 text-gray-900 px-6 py-2 font-bold hover:bg-yellow-500 transition-colors">
                SUBSCRIBE
              </button>
            </div>

            {/* Payment Methods */}
            <div className="mt-8">
              <h4 className="text-yellow-400 font-bold text-sm mb-3">100% SECURE PAYMENT</h4>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white px-2 py-1 rounded">
                  <span className="text-xs font-bold text-gray-700">G Pay</span>
                </div>
                <div className="bg-white px-2 py-1 rounded">
                  <span className="text-xs font-bold text-blue-600">Paytm</span>
                </div>
                <div className="bg-white px-2 py-1 rounded">
                  <span className="text-xs font-bold text-purple-600">PhonePe</span>
                </div>
                <div className="bg-white px-2 py-1 rounded">
                  <span className="text-xs font-bold text-blue-800">VISA</span>
                </div>
                <div className="bg-white px-2 py-1 rounded">
                  <span className="text-xs font-bold text-orange-500">RuPay</span>
                </div>
                <div className="bg-white px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <div className="w-4 h-4 rounded-full bg-orange-500 -ml-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="border-t border-gray-800 pt-8">
          <Link href="/">
            <Image
              src="/logo1.png"
              alt="Logo"
              width={320}
              height={60}
              className="object-contain mt-2"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React from 'react'
import { Link } from 'react-router-dom'
import RegisterForm from '../components/auth/RegisterForm'

const Register: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm
          onSwitchToLogin={() => {
            // This will be handled by React Router navigation
            window.location.href = '/login'
          }}
        />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-black hover:text-gray-700"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="mt-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Join thousands of smart spenders
          </h2>
          <p className="text-lg text-gray-600">
            Take control of your finances with our AI-powered expense tracker
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Always Free</h3>
            </div>
            <p className="text-gray-600">
              No hidden fees, no premium tiers. All features are completely free
              for personal use.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Secure & Private</h3>
            </div>
            <p className="text-gray-600">
              Your financial data is encrypted and secure. We never share your
              information with third parties.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cross-Platform</h3>
            </div>
            <p className="text-gray-600">
              Access your expenses from any device. Web, mobile, or desktop -
              your data syncs everywhere.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-soft">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 font-bold">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Setup</h3>
            </div>
            <p className="text-gray-600">
              Get started in under 2 minutes. No complex setup or configurations
              required.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-16 bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              What our users say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-600 mb-4">
                "This app completely changed how I manage my money. The AI categorization
                is spot-on and saves me so much time!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Freelance Designer</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-600 mb-4">
                "Finally, an expense tracker that actually understands my spending patterns.
                The insights helped me save $200 last month!"
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Mike Chen</p>
                  <p className="text-sm text-gray-500">Software Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ExpenseTracker</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 ExpenseTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Register
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm
          onSwitchToRegister={() => {
            // This will be handled by React Router navigation
            window.location.href = '/register'
          }}
        />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-black hover:text-gray-700"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">
            Smart Expense Tracking Made Simple
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-black rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Categorization</h3>
            <p className="text-gray-600">
              Automatically categorize your expenses with machine learning.
              No more manual sorting.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-black rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Analytics</h3>
            <p className="text-gray-600">
              Get personalized insights and recommendations to improve your
              spending habits.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-black rounded-xl flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget Tracking</h3>
            <p className="text-gray-600">
              Set budgets and track your progress in real-time.
              Never overspend again.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
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

export default Login
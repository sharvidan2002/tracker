import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Home,
  Receipt,
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  X
} from 'lucide-react'
import Button from '../ui/Button'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Budget', href: '/budget', icon: Wallet },
]

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen,
          }
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">$</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                ExpenseTracker
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pt-4 pb-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    {
                      'bg-black text-white': isActive,
                      'text-gray-700 hover:bg-gray-100 hover:text-gray-900': !isActive,
                    }
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      {
                        'text-white': isActive,
                        'text-gray-500 group-hover:text-gray-700': !isActive,
                      }
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className="border-t border-gray-200 px-4 py-4 space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={clsx(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    {
                      'bg-black text-white': isActive,
                      'text-gray-700 hover:bg-gray-100 hover:text-gray-900': !isActive,
                    }
                  )}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      {
                        'text-white': isActive,
                        'text-gray-500 group-hover:text-gray-700': !isActive,
                      }
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-xs text-gray-500 text-center">
              © 2024 ExpenseTracker
              <br />
              Version 1.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useAuth } from '../contexts/AuthContext'
import { useExpenses } from '../hooks/useExpenses'
import { useBudgets } from '../hooks/useBudgets'
import { COLORS, FONT_SIZES, SPACING } from '../constants/theme'
import { formatCurrency, formatDate } from '../utils/formatters'
import { Expense, Budget } from '../types'

interface DashboardStats {
  todaySpent: number
  weekSpent: number
  monthSpent: number
  totalExpenses: number
}

interface QuickAction {
  id: string
  title: string
  icon: string
  color: string
  onPress: () => void
}

const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    todaySpent: 0,
    weekSpent: 0,
    monthSpent: 0,
    totalExpenses: 0,
  })

  const { user, logout } = useAuth()
  const navigation = useNavigation()

  const {
    data: expensesData,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses({
    limit: 5,
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const {
    data: budgetsData,
    isLoading: budgetsLoading,
    refetch: refetchBudgets,
  } = useBudgets()

  const expenses = expensesData?.data || []
  const budgets = budgetsData?.data || []

  // Calculate dashboard statistics
  useEffect(() => {
    if (expenses.length > 0) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const todaySpent = expenses
        .filter(expense => new Date(expense.date) >= today)
        .reduce((sum, expense) => sum + expense.amount, 0)

      const weekSpent = expenses
        .filter(expense => new Date(expense.date) >= weekStart)
        .reduce((sum, expense) => sum + expense.amount, 0)

      const monthSpent = expenses
        .filter(expense => new Date(expense.date) >= monthStart)
        .reduce((sum, expense) => sum + expense.amount, 0)

      setStats({
        todaySpent,
        weekSpent,
        monthSpent,
        totalExpenses: expenses.length,
      })
    }
  }, [expenses])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([refetchExpenses(), refetchBudgets()])
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
    setRefreshing(false)
  }, [refetchExpenses, refetchBudgets])

  useFocusEffect(
    useCallback(() => {
      onRefresh()
    }, [onRefresh])
  )

  const quickActions: QuickAction[] = [
    {
      id: 'add-expense',
      title: 'Add Expense',
      icon: 'add-circle',
      color: COLORS.primary,
      onPress: () => navigation.navigate('AddExpense' as never),
    },
    {
      id: 'scan-receipt',
      title: 'Scan Receipt',
      icon: 'camera-alt',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('ScanReceipt' as never),
    },
    {
      id: 'view-analytics',
      title: 'Analytics',
      icon: 'analytics',
      color: COLORS.success,
      onPress: () => navigation.navigate('Analytics' as never),
    },
    {
      id: 'manage-budgets',
      title: 'Budgets',
      icon: 'account-balance',
      color: COLORS.warning,
      onPress: () => navigation.navigate('Budgets' as never),
    },
  ]

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    )
  }

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onPress={() => navigation.navigate('ExpenseDetails' as never, { expenseId: item.id })}
    >
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.expenseMetadata}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
          <Text style={styles.expenseDate}>
            {formatDate(new Date(item.date), 'MMM dd')}
          </Text>
        </View>
      </View>
      <View style={styles.expenseAmount}>
        <Text style={styles.expenseAmountText}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const usagePercentage = (item.spent / item.amount) * 100
    const isOverBudget = usagePercentage > 100

    return (
      <TouchableOpacity
        style={styles.budgetItem}
        onPress={() => navigation.navigate('BudgetDetails' as never, { budgetId: item.id })}
      >
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetCategory}>{item.category}</Text>
          <Text style={[
            styles.budgetPercentage,
            isOverBudget && styles.budgetOverLimit
          ]}>
            {Math.round(usagePercentage)}%
          </Text>
        </View>
        <View style={styles.budgetProgressContainer}>
          <View style={styles.budgetProgressBackground}>
            <View
              style={[
                styles.budgetProgressFill,
                {
                  width: `${Math.min(usagePercentage, 100)}%`,
                  backgroundColor: isOverBudget ? COLORS.error : COLORS.primary,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.budgetAmounts}>
          <Text style={styles.budgetSpent}>
            {formatCurrency(item.spent)} spent
          </Text>
          <Text style={styles.budgetTotal}>
            of {formatCurrency(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderQuickAction = ({ item }: { item: QuickAction }) => (
    <TouchableOpacity style={styles.quickAction} onPress={item.onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${item.color}15` }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      <Text style={styles.quickActionTitle}>{item.title}</Text>
    </TouchableOpacity>
  )

  if (expensesError) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Failed to load data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}!</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="logout" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {(expensesLoading || budgetsLoading) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.todaySpent)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Week</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.weekSpent)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>This Month</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.monthSpent)}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <FlatList
          data={quickActions}
          renderItem={renderQuickAction}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsContainer}
        />
      </View>

      {/* Recent Expenses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses' as never)}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {expenses.length > 0 ? (
          <FlatList
            data={expenses.slice(0, 5)}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            style={styles.expensesList}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="receipt-long" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tracking by adding your first expense
            </Text>
          </View>
        )}
      </View>

      {/* Budget Overview */}
      {budgets.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budgets' as never)}>
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={budgets.slice(0, 3)}
            renderItem={renderBudgetItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
    </ScrollView>
  )
}

const getTimeOfDay = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  logoutButton: {
    padding: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  section: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingVertical: SPACING.sm,
  },
  quickAction: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 80,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  expensesList: {
    marginTop: SPACING.sm,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  expenseDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  expenseMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  expenseAmountText: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  budgetItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  budgetCategory: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  budgetPercentage: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  budgetOverLimit: {
    color: COLORS.error,
  },
  budgetProgressContainer: {
    marginBottom: SPACING.sm,
  },
  budgetProgressBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetSpent: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  budgetTotal: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
})

export default HomeScreen
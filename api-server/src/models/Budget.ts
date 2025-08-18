import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'
import { User } from './User'

export interface BudgetAttributes {
  id: string
  userId: string
  category: string
  amount: number
  spent: number
  remaining: number
  period: 'weekly' | 'monthly' | 'yearly'
  startDate: Date
  endDate: Date
  isActive: boolean
  alertThreshold: number // Percentage (0-100) when to send alerts
  createdAt: Date
  updatedAt: Date
}

export interface BudgetCreationAttributes extends Optional<
  BudgetAttributes,
  'id' | 'spent' | 'remaining' | 'startDate' | 'endDate' | 'isActive' | 'alertThreshold' | 'createdAt' | 'updatedAt'
> {}

export class Budget extends Model<BudgetAttributes, BudgetCreationAttributes> implements BudgetAttributes {
  public id!: string
  public userId!: string
  public category!: string
  public amount!: number
  public spent!: number
  public remaining!: number
  public period!: 'weekly' | 'monthly' | 'yearly'
  public startDate!: Date
  public endDate!: Date
  public isActive!: boolean
  public alertThreshold!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // Instance methods
  public updateSpent(newSpentAmount: number): void {
    this.spent = newSpentAmount
    this.remaining = this.amount - this.spent
  }

  public getUsagePercentage(): number {
    return (this.spent / this.amount) * 100
  }

  public isOverBudget(): boolean {
    return this.spent > this.amount
  }

  public shouldAlert(): boolean {
    return this.getUsagePercentage() >= this.alertThreshold
  }

  public getRemainingDays(): number {
    const now = new Date()
    const timeDiff = this.endDate.getTime() - now.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  public getDailyBudgetRemaining(): number {
    const remainingDays = this.getRemainingDays()
    if (remainingDays <= 0) return 0
    return this.remaining / remainingDays
  }

  // Static methods
  public static async findByUserAndPeriod(userId: string, period: string): Promise<Budget[]> {
    return this.findAll({
      where: {
        userId,
        period,
        isActive: true,
      },
      order: [['category', 'ASC']],
    })
  }

  public static async findActiveByUser(userId: string): Promise<Budget[]> {
    const now = new Date()
    return this.findAll({
      where: {
        userId,
        isActive: true,
        startDate: { [sequelize.Sequelize.Op.lte]: now },
        endDate: { [sequelize.Sequelize.Op.gte]: now },
      },
      order: [['category', 'ASC']],
    })
  }

  public static async findByCategory(userId: string, category: string): Promise<Budget | null> {
    const now = new Date()
    return this.findOne({
      where: {
        userId,
        category,
        isActive: true,
        startDate: { [sequelize.Sequelize.Op.lte]: now },
        endDate: { [sequelize.Sequelize.Op.gte]: now },
      },
    })
  }

  private static calculatePeriodDates(period: 'weekly' | 'monthly' | 'yearly'): { startDate: Date; endDate: Date } {
    const now = new Date()
    const startDate = new Date()
    const endDate = new Date()

    switch (period) {
      case 'weekly':
        startDate.setDate(now.getDate() - now.getDay())
        endDate.setDate(startDate.getDate() + 6)
        break
      case 'monthly':
        startDate.setDate(1)
        endDate.setMonth(startDate.getMonth() + 1, 0)
        break
      case 'yearly':
        startDate.setMonth(0, 1)
        endDate.setMonth(11, 31)
        break
    }

    // Set time to start/end of day
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    return { startDate, endDate }
  }
}

Budget.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
      get() {
        const value = this.getDataValue('amount')
        return value ? parseFloat(value.toString()) : 0
      },
    },
    spent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      get() {
        const value = this.getDataValue('spent')
        return value ? parseFloat(value.toString()) : 0
      },
    },
    remaining: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.amount - this.spent
      },
    },
    period: {
      type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    alertThreshold: {
      type: DataTypes.INTEGER,
      defaultValue: 80,
      validate: {
        min: 0,
        max: 100,
      },
    },
  },
  {
    sequelize,
    tableName: 'budgets',
    modelName: 'Budget',
    hooks: {
      beforeCreate: (budget: Budget) => {
        const { startDate, endDate } = Budget['calculatePeriodDates'](budget.period)
        budget.startDate = startDate
        budget.endDate = endDate
      },
      beforeUpdate: (budget: Budget) => {
        if (budget.changed('period')) {
          const { startDate, endDate } = Budget['calculatePeriodDates'](budget.period)
          budget.startDate = startDate
          budget.endDate = endDate
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: ['userId', 'category', 'period'],
        where: {
          isActive: true,
        },
      },
      {
        fields: ['userId', 'isActive'],
      },
      {
        fields: ['startDate', 'endDate'],
      },
      {
        fields: ['category'],
      },
    ],
    validate: {
      endDateAfterStartDate() {
        if (this.startDate && this.endDate && this.endDate <= this.startDate) {
          throw new Error('End date must be after start date')
        }
      },
    },
  }
)

// Associations
Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' })
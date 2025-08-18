import { Sequelize } from 'sequelize'
import { config } from './environment'

// PostgreSQL connection using Sequelize
export const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: 'postgres',
  logging: config.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})

export async function connectPostgreSQL(): Promise<void> {
  try {
    await sequelize.authenticate()
    console.log('✅ PostgreSQL connection established successfully')

    if (config.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true })
      console.log('📊 Database tables synchronized')
    }
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL:', error)
    throw error
  }
}

// Close PostgreSQL connection
export async function closePostgreSQL(): Promise<void> {
  try {
    await sequelize.close()
    console.log('🔒 PostgreSQL connection closed')
  } catch (error) {
    console.error('❌ Error closing PostgreSQL connection:', error)
    throw error
  }
}
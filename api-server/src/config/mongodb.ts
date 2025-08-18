import mongoose from 'mongoose'
import { config } from './environment'

// MongoDB connection options
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority',
}

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URL, mongoOptions)
    console.log('✅ MongoDB connection established successfully')
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:', error)
    throw error
  }
}

export async function closeMongoDB(): Promise<void> {
  try {
    await mongoose.connection.close()
    console.log('🔒 MongoDB connection closed')
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error)
    throw error
  }
}

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🍃 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('🔒 MongoDB connection closed through app termination')
  process.exit(0)
})
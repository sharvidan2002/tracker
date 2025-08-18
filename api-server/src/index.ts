import 'dotenv/config'
import app from './app'
import { connectPostgreSQL, connectMongoDB } from './config/database'
import { config } from './config/environment'

const PORT = config.PORT || 3001

async function startServer() {
  try {
    // Connect to databases
    await connectPostgreSQL()
    await connectMongoDB()

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📱 Environment: ${config.NODE_ENV}`)
      console.log(`🗄️  PostgreSQL: Connected`)
      console.log(`🍃 MongoDB: Connected`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT received, shutting down gracefully')
  process.exit(0)
})

process.on('unhandledRejection', (err: Error) => {
  console.error('💥 Unhandled rejection:', err)
  process.exit(1)
})

process.on('uncaughtException', (err: Error) => {
  console.error('💥 Uncaught exception:', err)
  process.exit(1)
})

startServer()
# Smart Expense Tracker

An AI-powered expense tracking application with automatic categorization and personalized financial insights.

## 🚀 Features

- **Automatic Expense Categorization**: ML-powered categorization of expenses based on description and merchant
- **AI Financial Advisor**: Personalized spending insights and recommendations using Gemini AI
- **Cross-Platform**: Web dashboard and mobile app for seamless expense tracking
- **Real-time Analytics**: Interactive charts and spending pattern analysis
- **Budget Management**: Set and track budgets with intelligent alerts
- **Receipt Scanning**: Mobile camera integration for quick expense entry
- **Smart Search**: Full-text search across all expenses
- **Data Export**: Export expense data in multiple formats

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   API Server    │
│  (React/Vite)   │◄──►│ (React Native)  │◄──►│   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                        ┌─────────────────┐           │
                        │   ML Service    │◄──────────┤
                        │    (Flask)      │           │
                        └─────────────────┘           │
                                                       │
                        ┌─────────────────┐           │
                        │   PostgreSQL    │◄──────────┤
                        │ (Structured)    │           │
                        └─────────────────┘           │
                                                       │
                        ┌─────────────────┐           │
                        │    MongoDB      │◄──────────┘
                        │ (Unstructured)  │
                        └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Web**: React 18, TypeScript, Tailwind CSS, Vite
- **Mobile**: React Native, TypeScript
- **Charts**: Recharts
- **State Management**: React Query, React Hook Form

### Backend
- **API Server**: Express.js, TypeScript
- **ML Service**: Flask, Python
- **Authentication**: JWT
- **File Upload**: Multer

### Databases
- **PostgreSQL**: User accounts, budgets, structured analytics
- **MongoDB**: Expenses, transactions, unstructured data
- **Redis**: Caching and sessions

### ML & AI
- **Scikit-learn**: Expense categorization model
- **Gemini AI**: Financial insights and recommendations
- **TF-IDF**: Text vectorization for expense descriptions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd smart-expense-tracker
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
# Copy environment files
cp api-server/.env.example api-server/.env
cp ml-service/.env.example ml-service/.env

# Configure your environment variables
# See Environment Variables section below
```

4. **Set up databases**
```bash
# PostgreSQL
createdb expense_tracker
psql expense_tracker < database/postgresql/schema.sql

# MongoDB (create database and collections)
mongosh < database/mongodb/collections.js
mongosh < database/mongodb/indexes.js
```

5. **Train the ML model**
```bash
cd ml-service
python scripts/train_model.py
```

6. **Start the development servers**
```bash
# Start all services
npm run dev

# Or start individually:
npm run dev:api     # API Server (http://localhost:3001)
npm run dev:web     # Web Client (http://localhost:3000)
npm run dev:ml      # ML Service (http://localhost:5000)
npm run dev:mobile  # Mobile Client
```

## 🔧 Environment Variables

### API Server (.env)
```env
NODE_ENV=development
PORT=3001

# Database URLs
DATABASE_URL=postgresql://postgres:password@localhost:5432/expense_tracker
MONGODB_URL=mongodb://localhost:27017/expense_tracker
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# External Services
ML_SERVICE_URL=http://localhost:5000
GEMINI_API_KEY=your-gemini-api-key

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Client Configuration
CLIENT_URL=http://localhost:3000
```

### ML Service (.env)
```env
FLASK_ENV=development
GEMINI_API_KEY=your-gemini-api-key
MODEL_PATH=./models/trained_model.pkl
TRAINING_DATA_PATH=./data/training_data.csv
```

### Web Client (.env)
```env
VITE_API_URL=http://localhost:3001
```

## 📱 Mobile Development

### iOS Setup
```bash
cd mobile-client
npx pod-install ios
npx react-native run-ios
```

### Android Setup
```bash
cd mobile-client
npx react-native run-android
```

## 🤖 ML Model Training

The expense categorization model uses TF-IDF vectorization and Multinomial Naive Bayes:

```bash
cd ml-service
python scripts/train_model.py
```

**Model Features:**
- Text preprocessing with stopword removal
- TF-IDF vectorization with n-grams
- Category prediction with confidence scores
- Fallback rule-based categorization

**Categories:**
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Travel
- Education
- Personal Care
- Gifts & Donations
- Business
- Other

## 📊 API Documentation

### Authentication
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Expenses
```bash
# Create expense
POST /api/expenses
{
  "amount": 25.50,
  "description": "Coffee at Starbucks",
  "category": "Food & Dining",
  "merchant": "Starbucks",
  "date": "2024-01-15T10:30:00Z"
}

# Get expenses with filters
GET /api/expenses?category=Food&dateFrom=2024-01-01&limit=20

# Auto-categorize
POST /api/expenses/categorize
{
  "description": "Coffee at local cafe",
  "merchant": "Joe's Coffee"
}
```

### Analytics
```bash
# Dashboard analytics
GET /api/analytics/dashboard?period=month

# Spending trends
GET /api/analytics/trends?period=year

# AI insights
GET /api/analytics/insights
```

### Budget
```bash
# Create budget
POST /api/budget
{
  "category": "Food & Dining",
  "amount": 500,
  "period": "monthly"
}

# Get budget performance
GET /api/budget/performance?period=monthly
```

## 🚢 Deployment

### Docker Deployment
```bash
# Build and run all services
docker-compose up -d

# Scale specific services
docker-compose up -d --scale api-server=3
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production servers
npm start
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific service tests
cd api-server && npm test
cd web-client && npm test
cd mobile-client && npm test
```

## 📈 Performance

- **API Response Time**: < 200ms average
- **ML Categorization**: < 100ms per expense
- **Database Queries**: Optimized with indexes
- **Caching**: Redis for frequent queries
- **File Uploads**: Streamed processing

## 🔒 Security

- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control
- **Data Validation**: Joi schema validation
- **Rate Limiting**: Express rate limiter
- **CORS**: Configured for production
- **Helmet**: Security headers
- **HTTPS**: SSL/TLS encryption in production

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL/MongoDB are running
   - Verify connection strings in .env files

2. **ML Model Training Fails**
   - Ensure Python dependencies are installed
   - Check training data format

3. **Mobile Build Errors**
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Clean and rebuild: `cd android && ./gradlew clean`

### Logs
```bash
# API Server logs
tail -f api-server/logs/app.log

# ML Service logs
tail -f ml-service/logs/flask.log
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Gemini AI** for intelligent financial insights
- **Scikit-learn** for machine learning capabilities
- **React** and **React Native** communities
- **Express.js** and **Flask** frameworks

## 📞 Support

- **Documentation**: [Wiki](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Email**: support@expensetracker.com

---

**Built with ❤️ for smarter financial management**
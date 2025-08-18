import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuration class for ML service"""

    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'ml-service-secret-key-change-in-production'

    # Environment
    FLASK_ENV = os.environ.get('FLASK_ENV') or 'development'
    DEBUG = FLASK_ENV == 'development'

    # Model settings
    MODEL_PATH = os.environ.get('MODEL_PATH') or './models/trained_model.pkl'
    MODEL_VERSION = os.environ.get('MODEL_VERSION') or '1.0.0'

    # AI API keys
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

    # Data settings
    TRAINING_DATA_PATH = os.environ.get('TRAINING_DATA_PATH') or './data/training_data.csv'
    CATEGORIES_PATH = os.environ.get('CATEGORIES_PATH') or './data/categories.json'

    # ML model parameters
    MODEL_CONFIDENCE_THRESHOLD = float(os.environ.get('MODEL_CONFIDENCE_THRESHOLD') or '0.6')
    MIN_TRAINING_SAMPLES = int(os.environ.get('MIN_TRAINING_SAMPLES') or '100')

    # Text processing
    MAX_TEXT_LENGTH = int(os.environ.get('MAX_TEXT_LENGTH') or '500')
    NGRAM_RANGE = (1, 2)  # Unigrams and bigrams
    MAX_FEATURES = int(os.environ.get('MAX_FEATURES') or '10000')

    # Fallback categories
    DEFAULT_CATEGORIES = [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Travel',
        'Education',
        'Personal Care',
        'Gifts & Donations',
        'Business',
        'Other'
    ]

    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL') or 'INFO'

    @staticmethod
    def init_app(app):
        """Initialize app with config"""
        pass

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False

    @classmethod
    def init_app(cls, app):
        Config.init_app(app)

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEBUG = True

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
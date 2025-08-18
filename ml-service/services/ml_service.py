import os
import pickle
import json
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import re
import joblib
from config import Config

class MLService:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.categories = Config.DEFAULT_CATEGORIES
        self.model_version = Config.MODEL_VERSION
        self.confidence_threshold = Config.MODEL_CONFIDENCE_THRESHOLD

        self.load_categories()
        self.load_model()

        # If no model exists, train with default data
        if self.model is None:
            self.train_with_default_data()

    def load_categories(self):
        """Load expense categories from file"""
        try:
            if os.path.exists(Config.CATEGORIES_PATH):
                with open(Config.CATEGORIES_PATH, 'r') as f:
                    data = json.load(f)
                    self.categories = data.get('categories', Config.DEFAULT_CATEGORIES)
            else:
                # Create default categories file
                self.save_categories()
        except Exception as e:
            print(f"Error loading categories: {e}")
            self.categories = Config.DEFAULT_CATEGORIES

    def save_categories(self):
        """Save categories to file"""
        try:
            os.makedirs(os.path.dirname(Config.CATEGORIES_PATH), exist_ok=True)
            with open(Config.CATEGORIES_PATH, 'w') as f:
                json.dump({'categories': self.categories}, f, indent=2)
        except Exception as e:
            print(f"Error saving categories: {e}")

    def load_model(self):
        """Load trained model from file"""
        try:
            if os.path.exists(Config.MODEL_PATH):
                with open(Config.MODEL_PATH, 'rb') as f:
                    model_data = pickle.load(f)
                    self.model = model_data['model']
                    self.vectorizer = model_data['vectorizer']
                    self.model_version = model_data.get('version', Config.MODEL_VERSION)
                print(f"Model loaded successfully. Version: {self.model_version}")
            else:
                print("No existing model found. Will train new model.")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
            self.vectorizer = None

    def save_model(self):
        """Save trained model to file"""
        try:
            os.makedirs(os.path.dirname(Config.MODEL_PATH), exist_ok=True)
            model_data = {
                'model': self.model,
                'vectorizer': self.vectorizer,
                'version': self.model_version,
                'categories': self.categories,
                'trained_at': datetime.now().isoformat(),
                'confidence_threshold': self.confidence_threshold
            }
            with open(Config.MODEL_PATH, 'wb') as f:
                pickle.dump(model_data, f)
            print(f"Model saved successfully. Version: {self.model_version}")
        except Exception as e:
            print(f"Error saving model: {e}")

    def preprocess_text(self, text):
        """Preprocess text for model input"""
        if not text:
            return ""

        # Convert to lowercase
        text = str(text).lower()

        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        # Limit length
        if len(text) > Config.MAX_TEXT_LENGTH:
            text = text[:Config.MAX_TEXT_LENGTH]

        return text

    def combine_features(self, description, merchant):
        """Combine description and merchant for better classification"""
        desc = self.preprocess_text(description)
        merch = self.preprocess_text(merchant) if merchant else ""

        # Give more weight to merchant name if available
        if merch:
            return f"{desc} {merch} {merch}"
        return desc

    def categorize(self, description, merchant=None):
        """Categorize an expense"""
        try:
            if not self.model or not self.vectorizer:
                return self.fallback_categorization(description, merchant)

            # Prepare text
            text = self.combine_features(description, merchant)

            if not text.strip():
                return {'category': 'Other', 'confidence': 0.0, 'suggestions': []}

            # Vectorize
            text_vector = self.vectorizer.transform([text])

            # Predict
            prediction = self.model.predict(text_vector)[0]
            probabilities = self.model.predict_proba(text_vector)[0]

            # Get confidence
            confidence = max(probabilities)

            # Get top suggestions
            top_indices = np.argsort(probabilities)[::-1][:3]
            suggestions = [self.model.classes_[i] for i in top_indices if probabilities[i] > 0.1]

            return {
                'category': prediction,
                'confidence': float(confidence),
                'suggestions': suggestions
            }

        except Exception as e:
            print(f"Categorization error: {e}")
            return self.fallback_categorization(description, merchant)

    def fallback_categorization(self, description, merchant):
        """Rule-based fallback categorization"""
        desc_lower = description.lower() if description else ""
        merch_lower = merchant.lower() if merchant else ""
        text = f"{desc_lower} {merch_lower}"

        # Food & Dining keywords
        if any(keyword in text for keyword in [
            'restaurant', 'food', 'cafe', 'coffee', 'dinner', 'lunch', 'breakfast',
            'pizza', 'burger', 'sushi', 'bar', 'pub', 'grill', 'diner',
            'mcdonalds', 'subway', 'starbucks', 'kfc', 'taco', 'dominos'
        ]):
            return {'category': 'Food & Dining', 'confidence': 0.7, 'suggestions': []}

        # Transportation keywords
        if any(keyword in text for keyword in [
            'gas', 'fuel', 'gasoline', 'uber', 'lyft', 'taxi', 'bus', 'train',
            'parking', 'toll', 'car', 'auto', 'shell', 'exxon', 'bp', 'chevron'
        ]):
            return {'category': 'Transportation', 'confidence': 0.7, 'suggestions': []}

        # Shopping keywords
        if any(keyword in text for keyword in [
            'amazon', 'target', 'walmart', 'costco', 'shop', 'store', 'retail',
            'clothes', 'clothing', 'shoes', 'mall', 'purchase', 'ebay', 'etsy'
        ]):
            return {'category': 'Shopping', 'confidence': 0.7, 'suggestions': []}

        # Entertainment keywords
        if any(keyword in text for keyword in [
            'movie', 'cinema', 'theater', 'netflix', 'spotify', 'games', 'gaming',
            'concert', 'show', 'event', 'ticket', 'entertainment'
        ]):
            return {'category': 'Entertainment', 'confidence': 0.7, 'suggestions': []}

        # Bills & Utilities keywords
        if any(keyword in text for keyword in [
            'electric', 'electricity', 'water', 'gas', 'internet', 'phone',
            'cable', 'utility', 'bill', 'payment', 'insurance', 'rent'
        ]):
            return {'category': 'Bills & Utilities', 'confidence': 0.7, 'suggestions': []}

        # Healthcare keywords
        if any(keyword in text for keyword in [
            'doctor', 'hospital', 'medical', 'pharmacy', 'health', 'dental',
            'clinic', 'medicine', 'prescription', 'cvs', 'walgreens'
        ]):
            return {'category': 'Healthcare', 'confidence': 0.7, 'suggestions': []}

        # Default
        return {'category': 'Other', 'confidence': 0.3, 'suggestions': []}

    def get_suggestions(self, description, merchant=None):
        """Get category suggestions"""
        result = self.categorize(description, merchant)
        return result.get('suggestions', [])

    def train_model(self, training_data):
        """Train the model with new data"""
        try:
            if len(training_data) < Config.MIN_TRAINING_SAMPLES:
                raise ValueError(f"Need at least {Config.MIN_TRAINING_SAMPLES} training samples")

            # Prepare data
            texts = []
            labels = []

            for item in training_data:
                if 'description' in item and 'category' in item:
                    text = self.combine_features(
                        item['description'],
                        item.get('merchant', '')
                    )
                    texts.append(text)
                    labels.append(item['category'])

            if len(texts) < Config.MIN_TRAINING_SAMPLES:
                raise ValueError("Not enough valid training samples")

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                texts, labels, test_size=0.2, random_state=42, stratify=labels
            )

            # Create pipeline
            self.vectorizer = TfidfVectorizer(
                max_features=Config.MAX_FEATURES,
                ngram_range=Config.NGRAM_RANGE,
                stop_words='english',
                lowercase=True,
                token_pattern=r'\b[a-zA-Z0-9][a-zA-Z0-9]+\b'
            )

            self.model = MultinomialNB(alpha=1.0)

            # Train
            X_train_vec = self.vectorizer.fit_transform(X_train)
            self.model.fit(X_train_vec, y_train)

            # Evaluate
            X_test_vec = self.vectorizer.transform(X_test)
            y_pred = self.model.predict(X_test_vec)
            accuracy = accuracy_score(y_test, y_pred)

            # Update version
            self.model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"

            # Save model
            self.save_model()

            return {
                'version': self.model_version,
                'accuracy': float(accuracy),
                'samples': len(training_data)
            }

        except Exception as e:
            print(f"Training error: {e}")
            raise e

    def train_with_default_data(self):
        """Train model with default/sample data"""
        try:
            # Check if training data file exists
            if os.path.exists(Config.TRAINING_DATA_PATH):
                df = pd.read_csv(Config.TRAINING_DATA_PATH)
                training_data = df.to_dict('records')
            else:
                # Create sample training data
                training_data = self.create_sample_training_data()

            if len(training_data) >= Config.MIN_TRAINING_SAMPLES:
                result = self.train_model(training_data)
                print(f"Model trained with default data. Accuracy: {result['accuracy']:.2f}")
            else:
                print("Not enough default training data. Using fallback categorization.")

        except Exception as e:
            print(f"Error training with default data: {e}")

    def create_sample_training_data(self):
        """Create sample training data for initial model"""
        sample_data = [
            # Food & Dining
            {'description': 'McDonald\'s Restaurant', 'merchant': 'McDonald\'s', 'category': 'Food & Dining'},
            {'description': 'Coffee at Starbucks', 'merchant': 'Starbucks', 'category': 'Food & Dining'},
            {'description': 'Dinner at restaurant', 'merchant': 'Local Grill', 'category': 'Food & Dining'},
            {'description': 'Pizza delivery', 'merchant': 'Pizza Hut', 'category': 'Food & Dining'},
            {'description': 'Grocery shopping', 'merchant': 'Whole Foods', 'category': 'Food & Dining'},

            # Transportation
            {'description': 'Gas station fill up', 'merchant': 'Shell', 'category': 'Transportation'},
            {'description': 'Uber ride downtown', 'merchant': 'Uber', 'category': 'Transportation'},
            {'description': 'Parking meter', 'merchant': 'City Parking', 'category': 'Transportation'},
            {'description': 'Car repair service', 'merchant': 'Auto Shop', 'category': 'Transportation'},
            {'description': 'Bus ticket', 'merchant': 'Metro Transit', 'category': 'Transportation'},

            # Shopping
            {'description': 'Online shopping', 'merchant': 'Amazon', 'category': 'Shopping'},
            {'description': 'Clothes shopping', 'merchant': 'Target', 'category': 'Shopping'},
            {'description': 'Electronics purchase', 'merchant': 'Best Buy', 'category': 'Shopping'},
            {'description': 'Home supplies', 'merchant': 'Home Depot', 'category': 'Shopping'},
            {'description': 'New shoes', 'merchant': 'Shoe Store', 'category': 'Shopping'},

            # Entertainment
            {'description': 'Movie tickets', 'merchant': 'AMC Theaters', 'category': 'Entertainment'},
            {'description': 'Netflix subscription', 'merchant': 'Netflix', 'category': 'Entertainment'},
            {'description': 'Concert tickets', 'merchant': 'Ticketmaster', 'category': 'Entertainment'},
            {'description': 'Video games', 'merchant': 'GameStop', 'category': 'Entertainment'},
            {'description': 'Spotify premium', 'merchant': 'Spotify', 'category': 'Entertainment'},

            # Bills & Utilities
            {'description': 'Electric bill payment', 'merchant': 'Electric Company', 'category': 'Bills & Utilities'},
            {'description': 'Internet service', 'merchant': 'Comcast', 'category': 'Bills & Utilities'},
            {'description': 'Phone bill', 'merchant': 'Verizon', 'category': 'Bills & Utilities'},
            {'description': 'Water utility', 'merchant': 'Water Department', 'category': 'Bills & Utilities'},
            {'description': 'Insurance payment', 'merchant': 'State Farm', 'category': 'Bills & Utilities'},

            # Healthcare
            {'description': 'Doctor visit copay', 'merchant': 'Medical Center', 'category': 'Healthcare'},
            {'description': 'Prescription medication', 'merchant': 'CVS Pharmacy', 'category': 'Healthcare'},
            {'description': 'Dental cleaning', 'merchant': 'Dental Office', 'category': 'Healthcare'},
            {'description': 'Eye exam', 'merchant': 'Eye Care Center', 'category': 'Healthcare'},
            {'description': 'Vitamins', 'merchant': 'Walgreens', 'category': 'Healthcare'},
        ]

        # Duplicate entries to reach minimum threshold
        while len(sample_data) < Config.MIN_TRAINING_SAMPLES:
            sample_data.extend(sample_data[:min(20, Config.MIN_TRAINING_SAMPLES - len(sample_data))])

        return sample_data

    def get_model_info(self):
        """Get information about the current model"""
        return {
            'version': self.model_version,
            'categories': self.categories,
            'confidence_threshold': self.confidence_threshold,
            'is_trained': self.model is not None,
            'model_type': 'Multinomial Naive Bayes',
            'features': 'TF-IDF with n-grams'
        }
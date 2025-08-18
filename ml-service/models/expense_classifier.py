import os
import pickle
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
import joblib
import re
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExpenseClassifier:
    """
    Machine Learning model for categorizing expenses based on description and merchant data.
    """

    def __init__(self, model_type='naive_bayes', config: Optional[Dict] = None):
        """
        Initialize the ExpenseClassifier.

        Args:
            model_type: Type of ML model ('naive_bayes', 'random_forest', 'logistic_regression')
            config: Configuration dictionary
        """
        self.model_type = model_type
        self.config = config or {}
        self.model = None
        self.vectorizer = None
        self.label_encoder = None
        self.categories = []
        self.feature_names = []
        self.is_trained = False
        self.model_version = None
        self.training_stats = {}

        # Initialize model based on type
        self._initialize_model()

    def _initialize_model(self):
        """Initialize the ML model based on the specified type."""
        if self.model_type == 'naive_bayes':
            self.model = MultinomialNB(alpha=1.0)
        elif self.model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        elif self.model_type == 'logistic_regression':
            self.model = LogisticRegression(
                max_iter=1000,
                random_state=42,
                multi_class='ovr'
            )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

        # Initialize vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=self.config.get('max_features', 10000),
            ngram_range=self.config.get('ngram_range', (1, 2)),
            stop_words='english',
            lowercase=True,
            token_pattern=r'\b[a-zA-Z0-9][a-zA-Z0-9]+\b',
            min_df=2,
            max_df=0.95
        )

        # Initialize label encoder
        self.label_encoder = LabelEncoder()

    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for feature extraction.

        Args:
            text: Raw text to preprocess

        Returns:
            Cleaned text
        """
        if not text:
            return ""

        # Convert to lowercase
        text = str(text).lower()

        # Remove special characters but keep spaces and alphanumeric
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)

        # Remove extra whitespace
        text = ' '.join(text.split())

        # Limit length
        max_length = self.config.get('max_text_length', 500)
        if len(text) > max_length:
            text = text[:max_length]

        return text

    def combine_features(self, description: str, merchant: Optional[str] = None) -> str:
        """
        Combine description and merchant information for feature extraction.

        Args:
            description: Expense description
            merchant: Merchant name (optional)

        Returns:
            Combined feature string
        """
        desc = self.preprocess_text(description)
        merch = self.preprocess_text(merchant) if merchant else ""

        # Give more weight to merchant name if available
        if merch:
            return f"{desc} {merch} {merch}"
        return desc

    def prepare_training_data(self, data: List[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
        """
        Prepare training data from raw input.

        Args:
            data: List of dictionaries with 'description', 'merchant', and 'category'

        Returns:
            Tuple of (features, labels)
        """
        features = []
        labels = []

        for item in data:
            if 'description' not in item or 'category' not in item:
                continue

            feature_text = self.combine_features(
                item['description'],
                item.get('merchant', '')
            )

            if feature_text.strip():  # Only add non-empty features
                features.append(feature_text)
                labels.append(item['category'])

        return features, labels

    def train(self, training_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Train the model on the provided data.

        Args:
            training_data: List of training examples

        Returns:
            Training statistics and metrics
        """
        logger.info(f"Starting training with {len(training_data)} samples")

        # Prepare data
        features, labels = self.prepare_training_data(training_data)

        if len(features) < 10:
            raise ValueError("Need at least 10 training samples")

        # Encode labels
        encoded_labels = self.label_encoder.fit_transform(labels)
        self.categories = self.label_encoder.classes_.tolist()

        # Split data for validation
        X_train, X_test, y_train, y_test = train_test_split(
            features, encoded_labels, test_size=0.2, random_state=42, stratify=encoded_labels
        )

        # Fit vectorizer and transform features
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)

        # Train model
        self.model.fit(X_train_vec, y_train)

        # Evaluate model
        y_pred = self.model.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)

        # Cross-validation score
        cv_scores = cross_val_score(self.model, X_train_vec, y_train, cv=5)

        # Feature importance (for some models)
        feature_importance = None
        if hasattr(self.model, 'feature_importances_'):
            feature_names = self.vectorizer.get_feature_names_out()
            feature_importance = dict(zip(
                feature_names,
                self.model.feature_importances_
            ))
            # Get top 20 features
            feature_importance = dict(sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:20])

        # Update training stats
        self.training_stats = {
            'accuracy': accuracy,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'n_samples': len(features),
            'n_features': X_train_vec.shape[1],
            'n_categories': len(self.categories),
            'feature_importance': feature_importance,
            'trained_at': datetime.now().isoformat(),
            'model_type': self.model_type
        }

        self.is_trained = True
        self.model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        logger.info(f"Training completed. Accuracy: {accuracy:.3f}, CV Score: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

        return self.training_stats

    def predict(self, description: str, merchant: Optional[str] = None) -> Dict[str, Any]:
        """
        Predict the category for a given expense.

        Args:
            description: Expense description
            merchant: Merchant name (optional)

        Returns:
            Dictionary with category, confidence, and suggestions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")

        # Prepare features
        feature_text = self.combine_features(description, merchant)

        if not feature_text.strip():
            return {
                'category': 'Other',
                'confidence': 0.0,
                'suggestions': []
            }

        # Transform features
        feature_vector = self.vectorizer.transform([feature_text])

        # Make prediction
        prediction = self.model.predict(feature_vector)[0]
        probabilities = self.model.predict_proba(feature_vector)[0]

        # Get category name
        category = self.label_encoder.inverse_transform([prediction])[0]
        confidence = max(probabilities)

        # Get top suggestions
        top_indices = np.argsort(probabilities)[::-1][:3]
        suggestions = [
            self.label_encoder.inverse_transform([idx])[0]
            for idx in top_indices
            if probabilities[idx] > 0.1
        ]

        return {
            'category': category,
            'confidence': float(confidence),
            'suggestions': suggestions
        }

    def predict_batch(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Predict categories for multiple expenses.

        Args:
            items: List of items with 'description' and optional 'merchant'

        Returns:
            List of prediction results
        """
        results = []

        for item in items:
            try:
                result = self.predict(
                    item['description'],
                    item.get('merchant', '')
                )
                result['id'] = item.get('id', '')
                results.append(result)
            except Exception as e:
                logger.error(f"Error predicting for item {item.get('id', '')}: {e}")
                results.append({
                    'id': item.get('id', ''),
                    'category': 'Other',
                    'confidence': 0.0,
                    'suggestions': [],
                    'error': str(e)
                })

        return results

    def save_model(self, filepath: str) -> None:
        """
        Save the trained model to disk.

        Args:
            filepath: Path to save the model
        """
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")

        model_data = {
            'model': self.model,
            'vectorizer': self.vectorizer,
            'label_encoder': self.label_encoder,
            'categories': self.categories,
            'model_type': self.model_type,
            'model_version': self.model_version,
            'training_stats': self.training_stats,
            'config': self.config,
            'is_trained': self.is_trained
        }

        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)

        logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: str) -> None:
        """
        Load a trained model from disk.

        Args:
            filepath: Path to the saved model
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")

        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)

        self.model = model_data['model']
        self.vectorizer = model_data['vectorizer']
        self.label_encoder = model_data['label_encoder']
        self.categories = model_data['categories']
        self.model_type = model_data['model_type']
        self.model_version = model_data['model_version']
        self.training_stats = model_data['training_stats']
        self.config = model_data['config']
        self.is_trained = model_data['is_trained']

        logger.info(f"Model loaded from {filepath}. Version: {self.model_version}")

    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model.

        Returns:
            Dictionary with model information
        """
        return {
            'model_type': self.model_type,
            'model_version': self.model_version,
            'is_trained': self.is_trained,
            'categories': self.categories,
            'training_stats': self.training_stats,
            'config': self.config
        }

    def retrain_incremental(self, new_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Retrain the model with new data (incremental learning).

        Args:
            new_data: New training examples

        Returns:
            Updated training statistics
        """
        if not self.is_trained:
            return self.train(new_data)

        # For now, we'll retrain the entire model
        # In production, you might want to implement true incremental learning
        logger.info("Performing full retrain with new data")

        # Prepare new features
        new_features, new_labels = self.prepare_training_data(new_data)

        if len(new_features) < 5:
            logger.warning("Too few new samples for retraining")
            return self.training_stats

        # Transform new features using existing vectorizer
        try:
            new_feature_vectors = self.vectorizer.transform(new_features)

            # Encode new labels (handle new categories)
            unique_new_labels = set(new_labels) - set(self.categories)
            if unique_new_labels:
                logger.info(f"Found new categories: {unique_new_labels}")
                # For simplicity, we'll trigger a full retrain
                # In production, you'd want to handle this more gracefully
                return self.train(new_data)

            encoded_new_labels = self.label_encoder.transform(new_labels)

            # Partial fit if supported
            if hasattr(self.model, 'partial_fit'):
                self.model.partial_fit(new_feature_vectors, encoded_new_labels)
                logger.info(f"Incremental training completed with {len(new_data)} new samples")
            else:
                logger.info("Model doesn't support incremental learning, triggering full retrain")
                return self.train(new_data)

        except Exception as e:
            logger.error(f"Error in incremental training: {e}")
            logger.info("Falling back to full retrain")
            return self.train(new_data)

        # Update version and stats
        self.model_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.training_stats['last_incremental_update'] = datetime.now().isoformat()
        self.training_stats['incremental_samples'] = len(new_data)

        return self.training_stats
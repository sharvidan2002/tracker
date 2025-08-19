#!/usr/bin/env python3
"""
Training script for the expense categorization model.
Run this script to train a new model with the provided training data.
"""

import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime
import argparse
import json
import joblib
import warnings
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import matplotlib.pyplot as plt
import seaborn as sns

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.expense_classifier import ExpenseClassifier
from config import Config

# Suppress warnings
warnings.filterwarnings('ignore')

def load_training_data(data_path: str) -> list:
    """Load training data from CSV file."""
    try:
        if not os.path.exists(data_path):
            print(f"Training data file not found: {data_path}")
            return []

        df = pd.read_csv(data_path)

        # Validate required columns
        required_columns = ['description', 'category']
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            print(f"Missing required columns: {missing_columns}")
            return []

        # Clean and validate data
        df = df.dropna(subset=['description', 'category'])
        df['description'] = df['description'].astype(str).str.strip()
        df['category'] = df['category'].astype(str).str.strip()
        df['merchant'] = df.get('merchant', '').astype(str).str.strip()

        # Remove empty descriptions or categories
        df = df[df['description'].str.len() > 0]
        df = df[df['category'].str.len() > 0]

        # Convert to list of dictionaries
        training_data = []
        for _, row in df.iterrows():
            training_data.append({
                'description': row['description'],
                'merchant': row['merchant'] if pd.notna(row.get('merchant')) and row['merchant'] else '',
                'category': row['category']
            })

        print(f"Loaded {len(training_data)} training samples from {data_path}")
        return training_data

    except Exception as e:
        print(f"Error loading training data: {e}")
        return []

def create_synthetic_data() -> list:
    """Create synthetic training data if no CSV file is available."""
    print("Creating synthetic training data...")

    synthetic_data = [
        # Food & Dining
        {'description': 'Starbucks coffee', 'merchant': 'Starbucks', 'category': 'Food & Dining'},
        {'description': 'McDonald lunch', 'merchant': 'McDonald\'s', 'category': 'Food & Dining'},
        {'description': 'Pizza delivery', 'merchant': 'Dominos', 'category': 'Food & Dining'},
        {'description': 'Grocery shopping', 'merchant': 'Walmart', 'category': 'Food & Dining'},
        {'description': 'Restaurant dinner', 'merchant': 'Olive Garden', 'category': 'Food & Dining'},
        {'description': 'Coffee shop', 'merchant': 'Local Cafe', 'category': 'Food & Dining'},
        {'description': 'Fast food lunch', 'merchant': 'Burger King', 'category': 'Food & Dining'},
        {'description': 'Bakery purchase', 'merchant': 'Sweet Treats', 'category': 'Food & Dining'},

        # Transportation
        {'description': 'Gas station fill up', 'merchant': 'Shell', 'category': 'Transportation'},
        {'description': 'Uber ride', 'merchant': 'Uber', 'category': 'Transportation'},
        {'description': 'Taxi fare', 'merchant': 'Yellow Cab', 'category': 'Transportation'},
        {'description': 'Bus ticket', 'merchant': 'Metro Transit', 'category': 'Transportation'},
        {'description': 'Parking fee', 'merchant': 'ParkWhiz', 'category': 'Transportation'},
        {'description': 'Car maintenance', 'merchant': 'Auto Shop', 'category': 'Transportation'},
        {'description': 'Oil change', 'merchant': 'Jiffy Lube', 'category': 'Transportation'},
        {'description': 'Car wash', 'merchant': 'Clean Car', 'category': 'Transportation'},

        # Shopping
        {'description': 'Amazon purchase', 'merchant': 'Amazon', 'category': 'Shopping'},
        {'description': 'Clothes shopping', 'merchant': 'Target', 'category': 'Shopping'},
        {'description': 'Electronics store', 'merchant': 'Best Buy', 'category': 'Shopping'},
        {'description': 'Home supplies', 'merchant': 'Home Depot', 'category': 'Shopping'},
        {'description': 'Book purchase', 'merchant': 'Barnes & Noble', 'category': 'Shopping'},
        {'description': 'Online shopping', 'merchant': 'eBay', 'category': 'Shopping'},
        {'description': 'Pharmacy purchase', 'merchant': 'CVS', 'category': 'Shopping'},
        {'description': 'Pet supplies', 'merchant': 'PetSmart', 'category': 'Shopping'},

        # Entertainment
        {'description': 'Movie tickets', 'merchant': 'AMC Theaters', 'category': 'Entertainment'},
        {'description': 'Concert tickets', 'merchant': 'Ticketmaster', 'category': 'Entertainment'},
        {'description': 'Streaming service', 'merchant': 'Netflix', 'category': 'Entertainment'},
        {'description': 'Video games', 'merchant': 'GameStop', 'category': 'Entertainment'},
        {'description': 'Sports event', 'merchant': 'Stadium', 'category': 'Entertainment'},
        {'description': 'Bowling night', 'merchant': 'Strike Zone', 'category': 'Entertainment'},
        {'description': 'Theme park', 'merchant': 'Disney World', 'category': 'Entertainment'},
        {'description': 'Museum visit', 'merchant': 'Art Museum', 'category': 'Entertainment'},

        # Bills & Utilities
        {'description': 'Electric bill', 'merchant': 'Electric Company', 'category': 'Bills & Utilities'},
        {'description': 'Internet bill', 'merchant': 'Comcast', 'category': 'Bills & Utilities'},
        {'description': 'Phone bill', 'merchant': 'Verizon', 'category': 'Bills & Utilities'},
        {'description': 'Water bill', 'merchant': 'Water Department', 'category': 'Bills & Utilities'},
        {'description': 'Rent payment', 'merchant': 'Property Management', 'category': 'Bills & Utilities'},
        {'description': 'Insurance premium', 'merchant': 'State Farm', 'category': 'Bills & Utilities'},
        {'description': 'Credit card payment', 'merchant': 'Chase Bank', 'category': 'Bills & Utilities'},
        {'description': 'Loan payment', 'merchant': 'Bank of America', 'category': 'Bills & Utilities'},

        # Healthcare
        {'description': 'Doctor visit', 'merchant': 'Medical Center', 'category': 'Healthcare'},
        {'description': 'Pharmacy prescription', 'merchant': 'Walgreens', 'category': 'Healthcare'},
        {'description': 'Dentist appointment', 'merchant': 'Dental Clinic', 'category': 'Healthcare'},
        {'description': 'Eye exam', 'merchant': 'Vision Center', 'category': 'Healthcare'},
        {'description': 'Physical therapy', 'merchant': 'PT Clinic', 'category': 'Healthcare'},
        {'description': 'Lab tests', 'merchant': 'LabCorp', 'category': 'Healthcare'},
        {'description': 'Hospital bill', 'merchant': 'General Hospital', 'category': 'Healthcare'},
        {'description': 'Urgent care', 'merchant': 'Urgent Care Center', 'category': 'Healthcare'},

        # Travel
        {'description': 'Flight booking', 'merchant': 'Delta Airlines', 'category': 'Travel'},
        {'description': 'Hotel reservation', 'merchant': 'Marriott', 'category': 'Travel'},
        {'description': 'Car rental', 'merchant': 'Hertz', 'category': 'Travel'},
        {'description': 'Travel insurance', 'merchant': 'Travel Guard', 'category': 'Travel'},
        {'description': 'Airport parking', 'merchant': 'Airport Authority', 'category': 'Travel'},
        {'description': 'Vacation package', 'merchant': 'Expedia', 'category': 'Travel'},
        {'description': 'Train ticket', 'merchant': 'Amtrak', 'category': 'Travel'},
        {'description': 'Travel gear', 'merchant': 'REI', 'category': 'Travel'},
    ]

    print(f"Created {len(synthetic_data)} synthetic training samples")
    return synthetic_data

def prepare_features(data: list) -> tuple:
    """Prepare features and labels for training."""
    descriptions = []
    categories = []

    for item in data:
        # Combine description and merchant for better feature extraction
        text = item['description']
        if item.get('merchant'):
            text += f" {item['merchant']}"

        descriptions.append(text.lower().strip())
        categories.append(item['category'])

    return descriptions, categories

def train_multiple_models(X_train, X_test, y_train, y_test, vectorizer):
    """Train and compare multiple models."""
    models = {
        'Naive Bayes': MultinomialNB(),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42)
    }

    results = {}

    for name, model in models.items():
        print(f"\nTraining {name}...")

        # Create pipeline
        pipeline = Pipeline([
            ('vectorizer', vectorizer),
            ('classifier', model)
        ])

        # Train model
        pipeline.fit(X_train, y_train)

        # Make predictions
        y_pred = pipeline.predict(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5)

        results[name] = {
            'model': pipeline,
            'accuracy': accuracy,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'predictions': y_pred
        }

        print(f"{name} - Accuracy: {accuracy:.4f}")
        print(f"{name} - CV Score: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    return results

def hyperparameter_tuning(X_train, y_train, best_model_name):
    """Perform hyperparameter tuning for the best model."""
    print(f"\nPerforming hyperparameter tuning for {best_model_name}...")

    if best_model_name == 'Naive Bayes':
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', MultinomialNB())
        ])

        param_grid = {
            'vectorizer__max_features': [1000, 2000, 3000],
            'vectorizer__ngram_range': [(1, 1), (1, 2), (1, 3)],
            'vectorizer__min_df': [1, 2, 3],
            'classifier__alpha': [0.1, 0.5, 1.0, 2.0]
        }

    elif best_model_name == 'Random Forest':
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', RandomForestClassifier(random_state=42))
        ])

        param_grid = {
            'vectorizer__max_features': [1000, 2000],
            'vectorizer__ngram_range': [(1, 1), (1, 2)],
            'classifier__n_estimators': [50, 100, 200],
            'classifier__max_depth': [10, 20, None]
        }

    else:  # Logistic Regression
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', LogisticRegression(max_iter=1000, random_state=42))
        ])

        param_grid = {
            'vectorizer__max_features': [1000, 2000],
            'vectorizer__ngram_range': [(1, 1), (1, 2)],
            'classifier__C': [0.1, 1.0, 10.0],
            'classifier__penalty': ['l2']
        }

    # Perform grid search
    grid_search = GridSearchCV(
        pipeline,
        param_grid,
        cv=3,
        scoring='accuracy',
        n_jobs=-1,
        verbose=1
    )

    grid_search.fit(X_train, y_train)

    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best cross-validation score: {grid_search.best_score_:.4f}")

    return grid_search.best_estimator_

def evaluate_model(model, X_test, y_test, categories):
    """Evaluate the trained model and generate reports."""
    print("\nEvaluating final model...")

    # Make predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test) if hasattr(model, 'predict_proba') else None

    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Final model accuracy: {accuracy:.4f}")

    # Generate classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Generate confusion matrix
    cm = confusion_matrix(y_test, y_pred, labels=categories)

    # Plot confusion matrix
    plt.figure(figsize=(12, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=categories, yticklabels=categories)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=45)
    plt.yticks(rotation=0)
    plt.tight_layout()

    # Save confusion matrix
    os.makedirs('reports', exist_ok=True)
    plt.savefig('reports/confusion_matrix.png', dpi=300, bbox_inches='tight')
    print("Confusion matrix saved to reports/confusion_matrix.png")
    plt.close()

    return accuracy, y_pred, y_pred_proba

def save_model_and_metadata(model, accuracy, categories, model_path, metadata_path):
    """Save the trained model and metadata."""
    print(f"\nSaving model to {model_path}...")

    # Create directories if they don't exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    os.makedirs(os.path.dirname(metadata_path), exist_ok=True)

    # Save the model
    joblib.dump(model, model_path)

    # Save metadata
    metadata = {
        'model_type': type(model).__name__,
        'accuracy': accuracy,
        'categories': categories,
        'training_date': datetime.now().isoformat(),
        'feature_count': model.named_steps['vectorizer'].get_feature_names_out().shape[0] if hasattr(model, 'named_steps') else 'unknown',
        'version': '1.0'
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Model saved successfully!")
    print(f"Model accuracy: {accuracy:.4f}")
    print(f"Categories: {categories}")

def main():
    parser = argparse.ArgumentParser(description='Train expense categorization model')
    parser.add_argument('--data', type=str, help='Path to training data CSV file')
    parser.add_argument('--output', type=str, default='models/trained_model.pkl',
                       help='Output path for trained model')
    parser.add_argument('--test-size', type=float, default=0.2,
                       help='Test set size (default: 0.2)')
    parser.add_argument('--tune', action='store_true',
                       help='Perform hyperparameter tuning')
    parser.add_argument('--synthetic', action='store_true',
                       help='Use synthetic data if no data file provided')

    args = parser.parse_args()

    print("Starting expense categorization model training...")
    print(f"{'='*50}")

    # Load training data
    if args.data and os.path.exists(args.data):
        training_data = load_training_data(args.data)
    elif args.synthetic:
        training_data = create_synthetic_data()
    else:
        print("No training data provided. Use --data path/to/data.csv or --synthetic")
        return

    if not training_data:
        print("No training data available. Exiting.")
        return

    # Prepare features and labels
    print(f"\nPreparing features from {len(training_data)} samples...")
    descriptions, categories = prepare_features(training_data)

    # Get unique categories
    unique_categories = sorted(list(set(categories)))
    print(f"Found {len(unique_categories)} categories: {unique_categories}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        descriptions, categories,
        test_size=args.test_size,
        random_state=42,
        stratify=categories
    )

    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")

    # Create vectorizer
    vectorizer = TfidfVectorizer(
        max_features=2000,
        ngram_range=(1, 2),
        min_df=1,
        stop_words='english'
    )

    # Train multiple models and compare
    results = train_multiple_models(X_train, X_test, y_train, y_test, vectorizer)

    # Find best model
    best_model_name = max(results.keys(), key=lambda k: results[k]['accuracy'])
    best_model = results[best_model_name]['model']

    print(f"\nBest model: {best_model_name}")
    print(f"Best accuracy: {results[best_model_name]['accuracy']:.4f}")

    # Hyperparameter tuning if requested
    if args.tune:
        best_model = hyperparameter_tuning(X_train, y_train, best_model_name)

    # Final evaluation
    accuracy, y_pred, y_pred_proba = evaluate_model(best_model, X_test, y_test, unique_categories)

    # Save model and metadata
    model_path = args.output
    metadata_path = args.output.replace('.pkl', '_metadata.json')
    save_model_and_metadata(best_model, accuracy, unique_categories, model_path, metadata_path)

    # Test the saved model
    print(f"\nTesting saved model...")
    try:
        classifier = ExpenseClassifier()
        classifier.load_model(model_path)

        # Test with a few examples
        test_examples = [
            {'description': 'Coffee at Starbucks', 'merchant': 'Starbucks'},
            {'description': 'Gas station purchase', 'merchant': 'Shell'},
            {'description': 'Amazon online shopping', 'merchant': 'Amazon'},
        ]

        for example in test_examples:
            result = classifier.categorize(example['description'], example.get('merchant'))
            print(f"'{example['description']}' -> {result['category']} (confidence: {result['confidence']:.3f})")

        print("\nModel training completed successfully!")

    except Exception as e:
        print(f"Error testing saved model: {e}")

if __name__ == "__main__":
    main()
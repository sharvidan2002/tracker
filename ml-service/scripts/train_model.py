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

try:
    from models.expense_classifier import ExpenseClassifier
    from config import Config
except ImportError as e:
    print(f"Warning: Could not import custom modules: {e}")
    print("Continuing without custom modules...")

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
        {'description': 'Starbucks coffee morning', 'merchant': 'Starbucks', 'category': 'Food & Dining'},
        {'description': 'McDonald lunch meal', 'merchant': 'McDonald\'s', 'category': 'Food & Dining'},
        {'description': 'Pizza delivery dinner', 'merchant': 'Dominos', 'category': 'Food & Dining'},
        {'description': 'Grocery shopping weekly', 'merchant': 'Walmart', 'category': 'Food & Dining'},
        {'description': 'Restaurant dinner date', 'merchant': 'Olive Garden', 'category': 'Food & Dining'},
        {'description': 'Coffee shop meeting', 'merchant': 'Local Cafe', 'category': 'Food & Dining'},
        {'description': 'Fast food quick lunch', 'merchant': 'Burger King', 'category': 'Food & Dining'},
        {'description': 'Bakery fresh bread', 'merchant': 'Sweet Treats', 'category': 'Food & Dining'},
        {'description': 'Sushi restaurant dinner', 'merchant': 'Sakura Sushi', 'category': 'Food & Dining'},
        {'description': 'Ice cream dessert', 'merchant': 'Dairy Queen', 'category': 'Food & Dining'},

        # Transportation
        {'description': 'Gas station fill up', 'merchant': 'Shell', 'category': 'Transportation'},
        {'description': 'Uber ride downtown', 'merchant': 'Uber', 'category': 'Transportation'},
        {'description': 'Taxi fare airport', 'merchant': 'Yellow Cab', 'category': 'Transportation'},
        {'description': 'Bus ticket monthly pass', 'merchant': 'Metro Transit', 'category': 'Transportation'},
        {'description': 'Parking fee shopping mall', 'merchant': 'ParkWhiz', 'category': 'Transportation'},
        {'description': 'Car maintenance oil change', 'merchant': 'Auto Shop', 'category': 'Transportation'},
        {'description': 'Oil change service', 'merchant': 'Jiffy Lube', 'category': 'Transportation'},
        {'description': 'Car wash detail', 'merchant': 'Clean Car', 'category': 'Transportation'},
        {'description': 'Train ticket commute', 'merchant': 'Metro Rail', 'category': 'Transportation'},
        {'description': 'Lyft ride home', 'merchant': 'Lyft', 'category': 'Transportation'},

        # Shopping
        {'description': 'Amazon package delivery', 'merchant': 'Amazon', 'category': 'Shopping'},
        {'description': 'Clothes shopping weekend', 'merchant': 'Target', 'category': 'Shopping'},
        {'description': 'Electronics store laptop', 'merchant': 'Best Buy', 'category': 'Shopping'},
        {'description': 'Home supplies renovation', 'merchant': 'Home Depot', 'category': 'Shopping'},
        {'description': 'Book purchase novel', 'merchant': 'Barnes & Noble', 'category': 'Shopping'},
        {'description': 'Online shopping deals', 'merchant': 'eBay', 'category': 'Shopping'},
        {'description': 'Pharmacy vitamins', 'merchant': 'CVS', 'category': 'Shopping'},
        {'description': 'Pet supplies dog food', 'merchant': 'PetSmart', 'category': 'Shopping'},
        {'description': 'Clothing store shoes', 'merchant': 'Nordstrom', 'category': 'Shopping'},
        {'description': 'Electronics phone case', 'merchant': 'Apple Store', 'category': 'Shopping'},

        # Entertainment
        {'description': 'Movie tickets weekend', 'merchant': 'AMC Theaters', 'category': 'Entertainment'},
        {'description': 'Concert tickets rock band', 'merchant': 'Ticketmaster', 'category': 'Entertainment'},
        {'description': 'Streaming service monthly', 'merchant': 'Netflix', 'category': 'Entertainment'},
        {'description': 'Video games new release', 'merchant': 'GameStop', 'category': 'Entertainment'},
        {'description': 'Sports event basketball', 'merchant': 'Stadium', 'category': 'Entertainment'},
        {'description': 'Bowling night friends', 'merchant': 'Strike Zone', 'category': 'Entertainment'},
        {'description': 'Theme park admission', 'merchant': 'Disney World', 'category': 'Entertainment'},
        {'description': 'Museum visit art exhibit', 'merchant': 'Art Museum', 'category': 'Entertainment'},
        {'description': 'Music streaming premium', 'merchant': 'Spotify', 'category': 'Entertainment'},
        {'description': 'Comedy show tickets', 'merchant': 'Comedy Club', 'category': 'Entertainment'},

        # Bills & Utilities
        {'description': 'Electric bill monthly payment', 'merchant': 'Electric Company', 'category': 'Bills & Utilities'},
        {'description': 'Internet bill high speed', 'merchant': 'Comcast', 'category': 'Bills & Utilities'},
        {'description': 'Phone bill unlimited plan', 'merchant': 'Verizon', 'category': 'Bills & Utilities'},
        {'description': 'Water bill quarterly', 'merchant': 'Water Department', 'category': 'Bills & Utilities'},
        {'description': 'Rent payment monthly', 'merchant': 'Property Management', 'category': 'Bills & Utilities'},
        {'description': 'Insurance premium auto', 'merchant': 'State Farm', 'category': 'Bills & Utilities'},
        {'description': 'Credit card payment', 'merchant': 'Chase Bank', 'category': 'Bills & Utilities'},
        {'description': 'Loan payment student', 'merchant': 'Bank of America', 'category': 'Bills & Utilities'},
        {'description': 'Cable TV subscription', 'merchant': 'DirectTV', 'category': 'Bills & Utilities'},
        {'description': 'Home insurance annual', 'merchant': 'Allstate', 'category': 'Bills & Utilities'},

        # Healthcare
        {'description': 'Doctor visit annual checkup', 'merchant': 'Medical Center', 'category': 'Healthcare'},
        {'description': 'Pharmacy prescription medication', 'merchant': 'Walgreens', 'category': 'Healthcare'},
        {'description': 'Dentist appointment cleaning', 'merchant': 'Dental Clinic', 'category': 'Healthcare'},
        {'description': 'Eye exam vision test', 'merchant': 'Vision Center', 'category': 'Healthcare'},
        {'description': 'Physical therapy session', 'merchant': 'PT Clinic', 'category': 'Healthcare'},
        {'description': 'Lab tests blood work', 'merchant': 'LabCorp', 'category': 'Healthcare'},
        {'description': 'Hospital bill emergency', 'merchant': 'General Hospital', 'category': 'Healthcare'},
        {'description': 'Urgent care flu symptoms', 'merchant': 'Urgent Care Center', 'category': 'Healthcare'},
        {'description': 'Specialist consultation', 'merchant': 'Cardiology Clinic', 'category': 'Healthcare'},
        {'description': 'Mental health therapy', 'merchant': 'Psychology Practice', 'category': 'Healthcare'},

        # Travel
        {'description': 'Flight booking vacation', 'merchant': 'Delta Airlines', 'category': 'Travel'},
        {'description': 'Hotel reservation business trip', 'merchant': 'Marriott', 'category': 'Travel'},
        {'description': 'Car rental weekend trip', 'merchant': 'Hertz', 'category': 'Travel'},
        {'description': 'Travel insurance coverage', 'merchant': 'Travel Guard', 'category': 'Travel'},
        {'description': 'Airport parking long term', 'merchant': 'Airport Authority', 'category': 'Travel'},
        {'description': 'Vacation package cruise', 'merchant': 'Expedia', 'category': 'Travel'},
        {'description': 'Train ticket cross country', 'merchant': 'Amtrak', 'category': 'Travel'},
        {'description': 'Travel gear backpack', 'merchant': 'REI', 'category': 'Travel'},
        {'description': 'Airline ticket domestic', 'merchant': 'Southwest Airlines', 'category': 'Travel'},
        {'description': 'Hotel booking conference', 'merchant': 'Hilton', 'category': 'Travel'},
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

def train_multiple_models(X_train, X_test, y_train, y_test):
    """Train and compare multiple models."""
    # Create vectorizer
    vectorizer = TfidfVectorizer(
        max_features=2000,
        ngram_range=(1, 2),
        min_df=1,
        stop_words='english'
    )

    models = {
        'Naive Bayes': Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=2000, ngram_range=(1, 2), min_df=1, stop_words='english')),
            ('classifier', MultinomialNB())
        ]),
        'Random Forest': Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=2000, ngram_range=(1, 2), min_df=1, stop_words='english')),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ]),
        'Logistic Regression': Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=2000, ngram_range=(1, 2), min_df=1, stop_words='english')),
            ('classifier', LogisticRegression(max_iter=1000, random_state=42))
        ])
    }

    results = {}

    for name, pipeline in models.items():
        print(f"\nTraining {name}...")

        # Train model
        pipeline.fit(X_train, y_train)

        # Make predictions
        y_pred = pipeline.predict(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)

        # Cross validation with error handling for small datasets
        try:
            cv_scores = cross_val_score(pipeline, X_train, y_train, cv=min(5, len(set(y_train))))
        except Exception as e:
            print(f"Warning: Cross-validation failed for {name}: {e}")
            cv_scores = np.array([accuracy])  # Use test accuracy as fallback

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
            'vectorizer__ngram_range': [(1, 1), (1, 2)],
            'vectorizer__min_df': [1, 2],
            'classifier__alpha': [0.1, 0.5, 1.0]
        }

    elif best_model_name == 'Random Forest':
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', RandomForestClassifier(random_state=42))
        ])

        param_grid = {
            'vectorizer__max_features': [1000, 2000],
            'vectorizer__ngram_range': [(1, 1), (1, 2)],
            'classifier__n_estimators': [50, 100],
            'classifier__max_depth': [10, 20]
        }

    else:  # Logistic Regression
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer()),
            ('classifier', LogisticRegression(max_iter=1000, random_state=42))
        ])

        param_grid = {
            'vectorizer__max_features': [1000, 2000],
            'vectorizer__ngram_range': [(1, 1), (1, 2)],
            'classifier__C': [0.1, 1.0, 10.0]
        }

    # Perform grid search with error handling
    try:
        grid_search = GridSearchCV(
            pipeline,
            param_grid,
            cv=min(3, len(set(y_train))),
            scoring='accuracy',
            n_jobs=1,  # Reduced to avoid potential issues
            verbose=1
        )

        grid_search.fit(X_train, y_train)

        print(f"Best parameters: {grid_search.best_params_}")
        print(f"Best cross-validation score: {grid_search.best_score_:.4f}")

        return grid_search.best_estimator_
    except Exception as e:
        print(f"Hyperparameter tuning failed: {e}")
        print("Using default parameters...")
        pipeline.fit(X_train, y_train)
        return pipeline

def evaluate_model(model, X_test, y_test, categories):
    """Evaluate the trained model and generate reports."""
    print("\nEvaluating final model...")

    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Final model accuracy: {accuracy:.4f}")

    # Generate classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Generate confusion matrix
    try:
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
    except Exception as e:
        print(f"Could not generate confusion matrix plot: {e}")

    return accuracy, y_pred

def save_model_and_metadata(model, accuracy, categories, model_path, metadata_path):
    """Save the trained model and metadata."""
    print(f"\nSaving model to {model_path}...")

    # Create directories if they don't exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    os.makedirs(os.path.dirname(metadata_path), exist_ok=True)

    try:
        # Save the model with protocol version for compatibility
        joblib.dump(model, model_path, protocol=2)
        print("Model saved with joblib")
    except Exception as e:
        print(f"Error saving model with joblib: {e}")
        # Try with pickle as fallback
        import pickle
        try:
            with open(model_path, 'wb') as f:
                pickle.dump(model, f, protocol=2)
            print("Model saved with pickle")
        except Exception as e2:
            print(f"Error saving model with pickle: {e2}")
            return False

    # Save metadata
    try:
        # Get feature count safely
        feature_count = 'unknown'
        if hasattr(model, 'named_steps') and 'vectorizer' in model.named_steps:
            try:
                feature_count = len(model.named_steps['vectorizer'].get_feature_names_out())
            except:
                feature_count = 'unknown'

        metadata = {
            'model_type': type(model.named_steps['classifier']).__name__ if hasattr(model, 'named_steps') else type(model).__name__,
            'accuracy': float(accuracy),
            'categories': categories,
            'training_date': datetime.now().isoformat(),
            'feature_count': feature_count,
            'version': '1.0'
        }

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        print(f"Model saved successfully!")
        print(f"Model accuracy: {accuracy:.4f}")
        print(f"Categories: {categories}")
        return True
    except Exception as e:
        print(f"Error saving metadata: {e}")
        return False

def test_saved_model_simple(model_path, categories):
    """Test the saved model with simple loading."""
    print(f"\nTesting saved model...")
    try:
        # Try loading with joblib first
        model = joblib.load(model_path)
        print("Model loaded successfully with joblib")

        # Test with a few examples
        test_examples = [
            "Coffee at Starbucks",
            "Gas station purchase",
            "Amazon online shopping",
            "Doctor visit",
            "Movie tickets"
        ]

        for example in test_examples:
            try:
                prediction = model.predict([example])[0]
                probabilities = model.predict_proba([example])[0] if hasattr(model, 'predict_proba') else None
                confidence = max(probabilities) if probabilities is not None else 0.0
                print(f"'{example}' -> {prediction} (confidence: {confidence:.3f})")
            except Exception as e:
                print(f"Error predicting '{example}': {e}")

        return True

    except Exception as e:
        print(f"Error testing saved model: {e}")
        return False

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

    # Split data with stratification if possible
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            descriptions, categories,
            test_size=args.test_size,
            random_state=42,
            stratify=categories
        )
    except ValueError as e:
        print(f"Warning: Could not stratify split: {e}")
        X_train, X_test, y_train, y_test = train_test_split(
            descriptions, categories,
            test_size=args.test_size,
            random_state=42
        )

    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")

    # Train multiple models and compare
    results = train_multiple_models(X_train, X_test, y_train, y_test)

    # Find best model
    best_model_name = max(results.keys(), key=lambda k: results[k]['accuracy'])
    best_model = results[best_model_name]['model']

    print(f"\nBest model: {best_model_name}")
    print(f"Best accuracy: {results[best_model_name]['accuracy']:.4f}")

    # Hyperparameter tuning if requested
    if args.tune:
        best_model = hyperparameter_tuning(X_train, y_train, best_model_name)

    # Final evaluation
    accuracy, y_pred = evaluate_model(best_model, X_test, y_test, unique_categories)

    # Save model and metadata
    model_path = args.output
    metadata_path = args.output.replace('.pkl', '_metadata.json')
    save_success = save_model_and_metadata(best_model, accuracy, unique_categories, model_path, metadata_path)

    if save_success:
        # Test the saved model with simple loading
        test_saved_model_simple(model_path, unique_categories)
        print("\nModel training completed successfully!")
    else:
        print("\nModel training completed but there were issues saving the model.")

if __name__ == "__main__":
    main()
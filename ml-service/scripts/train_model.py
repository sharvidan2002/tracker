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

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.expense_classifier import ExpenseClassifier
from config import Config

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

        # Convert to list of dictionaries
        training_data = []
        for _, row in df.iterrows():
            training_data.append({
                'description': str(row['description']),
                'merchant': str(row.get('merchant', '')) if pd.notna(row.get('merchant')) else '',
                'category': str(row['category'])
            })

        print(f"Loaded {len(training_data)} training samples from {data_path}")
        return training_data

    except Exception as e:
        print(f"Error loading training data: {e}")
        return []

def create_synthetic_data() -> list:
    """Create synthetic training data if no CSV file is available."""
    synthetic_data = [
        # Food & Dining
        {'description': 'McDonald\'s breakfast', 'merchant': 'McDonald\'s', 'category': 'Food & Dining'},
        {'description': 'Starbucks coffee', 'merchant': 'Starbucks', 'category': 'Food & Dining'},
        {'description': 'Grocery shopping', 'merchant': 'Whole Foods', 'category': 'Food & Dining'},
        {'description': 'Pizza delivery', 'merchant': 'Domino\'s', 'category': 'Food & Dining'},
        {'description': 'Restaurant dinner', 'merchant': 'Olive Garden', 'category': 'Food & Dining'},
        {'description': 'Fast food lunch', 'merchant': 'Chipotle', 'category': 'Food & Dining'},
        {'description': 'Coffee and pastry', 'merchant': 'Local Cafe', 'category': 'Food & Dining'},
        {'description': 'Sushi dinner', 'merchant': 'Sushi Palace', 'category': 'Food & Dining'},

        # Transportation
        {'description': 'Gas station fill up', 'merchant': 'Shell', 'category': 'Transportation'},
        {'description': 'Uber ride to airport', 'merchant': 'Uber', 'category': 'Transportation'},
        {'description': 'Bus ticket', 'merchant': 'Metro Transit', 'category': 'Transportation'},
        {'description': 'Parking meter downtown', 'merchant': 'City Parking', 'category': 'Transportation'},
        {'description': 'Car maintenance', 'merchant': 'Auto Shop', 'category': 'Transportation'},
        {'description': 'Lyft ride home', 'merchant': 'Lyft', 'category': 'Transportation'},
        {'description': 'Train ticket', 'merchant': 'Amtrak', 'category': 'Transportation'},
        {'description': 'Oil change service', 'merchant': 'Jiffy Lube', 'category': 'Transportation'},

        # Shopping
        {'description': 'Online shopping', 'merchant': 'Amazon', 'category': 'Shopping'},
        {'description': 'Clothes shopping', 'merchant': 'Target', 'category': 'Shopping'},
        {'description': 'Electronics purchase', 'merchant': 'Best Buy', 'category': 'Shopping'},
        {'description': 'Home improvement supplies', 'merchant': 'Home Depot', 'category': 'Shopping'},
        {'description': 'New shoes', 'merchant': 'Nike Store', 'category': 'Shopping'},
        {'description': 'Books and magazines', 'merchant': 'Barnes & Noble', 'category': 'Shopping'},
        {'description': 'Sporting goods', 'merchant': 'Dick\'s Sporting Goods', 'category': 'Shopping'},
        {'description': 'Furniture shopping', 'merchant': 'IKEA', 'category': 'Shopping'},

        # Entertainment
        {'description': 'Movie tickets', 'merchant': 'AMC Theaters', 'category': 'Entertainment'},
        {'description': 'Netflix subscription', 'merchant': 'Netflix', 'category': 'Entertainment'},
        {'description': 'Concert tickets', 'merchant': 'Ticketmaster', 'category': 'Entertainment'},
        {'description': 'Video games', 'merchant': 'GameStop', 'category': 'Entertainment'},
        {'description': 'Spotify premium', 'merchant': 'Spotify', 'category': 'Entertainment'},
        {'description': 'Bowling night', 'merchant': 'Strike Zone', 'category': 'Entertainment'},
        {'description': 'Theme park visit', 'merchant': 'Disneyland', 'category': 'Entertainment'},
        {'description': 'Sports event tickets', 'merchant': 'StubHub', 'category': 'Entertainment'},

        # Bills & Utilities
        {'description': 'Electric bill payment', 'merchant': 'PG&E', 'category': 'Bills & Utilities'},
        {'description': 'Internet service', 'merchant': 'Comcast', 'category': 'Bills & Utilities'},
        {'description': 'Phone bill', 'merchant': 'Verizon', 'category': 'Bills & Utilities'},
        {'description': 'Water utility bill', 'merchant': 'Water Department', 'category': 'Bills & Utilities'},
        {'description': 'Insurance payment', 'merchant': 'State Farm', 'category': 'Bills & Utilities'},
        {'description': 'Cable TV service', 'merchant': 'DirectTV', 'category': 'Bills & Utilities'},
        {'description': 'Garbage collection', 'merchant': 'Waste Management', 'category': 'Bills & Utilities'},
        {'description': 'HOA fees', 'merchant': 'Property Management', 'category': 'Bills & Utilities'},

        # Healthcare
        {'description': 'Doctor visit copay', 'merchant': 'Kaiser Permanente', 'category': 'Healthcare'},
        {'description': 'Prescription medication', 'merchant': 'CVS Pharmacy', 'category': 'Healthcare'},
        {'description': 'Dental cleaning', 'merchant': 'Dental Associates', 'category': 'Healthcare'},
        {'description': 'Eye exam', 'merchant': 'LensCrafters', 'category': 'Healthcare'},
        {'description': 'Vitamins and supplements', 'merchant': 'Walgreens', 'category': 'Healthcare'},
        {'description': 'Physical therapy', 'merchant': 'Sports Medicine', 'category': 'Healthcare'},
        {'description': 'Urgent care visit', 'merchant': 'Urgent Care Center', 'category': 'Healthcare'},
        {'description': 'Blood test', 'merchant': 'LabCorp', 'category': 'Healthcare'},

        # Travel
        {'description': 'Hotel accommodation', 'merchant': 'Marriott', 'category': 'Travel'},
        {'description': 'Flight to Chicago', 'merchant': 'United Airlines', 'category': 'Travel'},
        {'description': 'Rental car', 'merchant': 'Hertz', 'category': 'Travel'},
        {'description': 'Vacation resort', 'merchant': 'Hyatt Resort', 'category': 'Travel'},
        {'description': 'Airport parking', 'merchant': 'Airport Authority', 'category': 'Travel'},
        {'description': 'Travel booking fee', 'merchant': 'Expedia', 'category': 'Travel'},
        {'description': 'Cruise vacation', 'merchant': 'Royal Caribbean', 'category': 'Travel'},
        {'description': 'Tour guide service', 'merchant': 'City Tours', 'category': 'Travel'},

        # Education
        {'description': 'Online course', 'merchant': 'Udemy', 'category': 'Education'},
        {'description': 'Textbooks', 'merchant': 'Pearson', 'category': 'Education'},
        {'description': 'Professional certification', 'merchant': 'Microsoft', 'category': 'Education'},
        {'description': 'Workshop attendance', 'merchant': 'Learning Center', 'category': 'Education'},
        {'description': 'School supplies', 'merchant': 'Staples', 'category': 'Education'},
        {'description': 'Educational software', 'merchant': 'Adobe', 'category': 'Education'},
        {'description': 'Language lessons', 'merchant': 'Language School', 'category': 'Education'},
        {'description': 'Music lessons', 'merchant': 'Music Academy', 'category': 'Education'},

        # Personal Care
        {'description': 'Haircut and styling', 'merchant': 'Great Clips', 'category': 'Personal Care'},
        {'description': 'Spa treatment', 'merchant': 'Day Spa', 'category': 'Personal Care'},
        {'description': 'Manicure and pedicure', 'merchant': 'Nail Salon', 'category': 'Personal Care'},
        {'description': 'Skincare products', 'merchant': 'Sephora', 'category': 'Personal Care'},
        {'description': 'Makeup purchase', 'merchant': 'Ulta Beauty', 'category': 'Personal Care'},
        {'description': 'Gym membership', 'merchant': '24 Hour Fitness', 'category': 'Personal Care'},
        {'description': 'Massage therapy', 'merchant': 'Massage Envy', 'category': 'Personal Care'},
        {'description': 'Personal trainer', 'merchant': 'Fitness First', 'category': 'Personal Care'},

        # Gifts & Donations
        {'description': 'Birthday gift', 'merchant': 'Gift Shop', 'category': 'Gifts & Donations'},
        {'description': 'Charity donation', 'merchant': 'Red Cross', 'category': 'Gifts & Donations'},
        {'description': 'Church offering', 'merchant': 'Local Church', 'category': 'Gifts & Donations'},
        {'description': 'Wedding present', 'merchant': 'Registry Store', 'category': 'Gifts & Donations'},
        {'description': 'Holiday gifts', 'merchant': 'Department Store', 'category': 'Gifts & Donations'},
        {'description': 'Fundraiser contribution', 'merchant': 'School Foundation', 'category': 'Gifts & Donations'},
        {'description': 'Baby shower gift', 'merchant': 'Baby Store', 'category': 'Gifts & Donations'},
        {'description': 'Thank you gift', 'merchant': 'Flower Shop', 'category': 'Gifts & Donations'},

        # Business
        {'description': 'Office supplies', 'merchant': 'Staples', 'category': 'Business'},
        {'description': 'Business lunch', 'merchant': 'Restaurant', 'category': 'Business'},
        {'description': 'Conference registration', 'merchant': 'Event Management', 'category': 'Business'},
        {'description': 'Professional software', 'merchant': 'Microsoft', 'category': 'Business'},
        {'description': 'Business cards', 'merchant': 'Print Shop', 'category': 'Business'},
        {'description': 'Coworking space', 'merchant': 'WeWork', 'category': 'Business'},
        {'description': 'Marketing materials', 'merchant': 'FedEx Office', 'category': 'Business'},
        {'description': 'Professional development', 'merchant': 'Training Institute', 'category': 'Business'},

        # Other
        {'description': 'ATM withdrawal', 'merchant': 'Bank ATM', 'category': 'Other'},
        {'description': 'Bank fees', 'merchant': 'Chase Bank', 'category': 'Other'},
        {'description': 'Money transfer', 'merchant': 'Western Union', 'category': 'Other'},
        {'description': 'Investment contribution', 'merchant': 'Fidelity', 'category': 'Other'},
        {'description': 'Tax preparation', 'merchant': 'H&R Block', 'category': 'Other'},
        {'description': 'Legal services', 'merchant': 'Law Firm', 'category': 'Other'},
        {'description': 'Accounting services', 'merchant': 'CPA Office', 'category': 'Other'},
        {'description': 'Miscellaneous expense', 'merchant': 'Various', 'category': 'Other'},
    ]

    # Duplicate the data to reach minimum training samples
    multiplier = max(1, Config.MIN_TRAINING_SAMPLES // len(synthetic_data) + 1)
    extended_data = synthetic_data * multiplier

    print(f"Created {len(extended_data)} synthetic training samples")
    return extended_data

def train_model(model_type: str = 'naive_bayes', data_path: str = None) -> bool:
    """Train the expense categorization model."""
    try:
        print(f"Starting model training with {model_type}")

        # Load training data
        if data_path and os.path.exists(data_path):
            training_data = load_training_data(data_path)
        else:
            print("Using synthetic training data")
            training_data = create_synthetic_data()

        if len(training_data) < Config.MIN_TRAINING_SAMPLES:
            print(f"Insufficient training data. Need at least {Config.MIN_TRAINING_SAMPLES} samples")
            return False

        # Initialize model
        classifier = ExpenseClassifier(model_type=model_type, config={
            'max_features': Config.MAX_FEATURES,
            'ngram_range': Config.NGRAM_RANGE,
            'max_text_length': Config.MAX_TEXT_LENGTH,
        })

        # Train model
        print("Training model...")
        training_stats = classifier.train(training_data)

        # Save model
        model_path = Config.MODEL_PATH
        classifier.save_model(model_path)

        # Print training results
        print("\n" + "="*50)
        print("TRAINING COMPLETED SUCCESSFULLY")
        print("="*50)
        print(f"Model Type: {training_stats['model_type']}")
        print(f"Accuracy: {training_stats['accuracy']:.3f}")
        print(f"Cross-validation Score: {training_stats['cv_mean']:.3f} ± {training_stats['cv_std']:.3f}")
        print(f"Training Samples: {training_stats['n_samples']}")
        print(f"Features: {training_stats['n_features']}")
        print(f"Categories: {training_stats['n_categories']}")
        print(f"Model Version: {classifier.model_version}")
        print(f"Model saved to: {model_path}")

        # Test predictions
        print("\n" + "="*50)
        print("TESTING PREDICTIONS")
        print("="*50)

        test_examples = [
            ("McDonald's breakfast sandwich", "McDonald's"),
            ("Grocery shopping at store", "Whole Foods"),
            ("Gas for car", "Shell"),
            ("Movie night out", "AMC Theaters"),
            ("Electric bill payment", "PG&E"),
            ("Doctor visit copay", "Kaiser"),
            ("Flight to New York", "United Airlines"),
            ("Online course purchase", "Udemy"),
            ("Haircut appointment", "Great Clips"),
            ("Birthday gift purchase", "Target"),
        ]

        for description, merchant in test_examples:
            result = classifier.predict(description, merchant)
            print(f"'{description}' -> {result['category']} (confidence: {result['confidence']:.2f})")

        return True

    except Exception as e:
        print(f"Error during training: {e}")
        return False

def evaluate_model(model_path: str = None, test_data_path: str = None) -> None:
    """Evaluate the trained model on test data."""
    try:
        model_path = model_path or Config.MODEL_PATH

        if not os.path.exists(model_path):
            print(f"Model file not found: {model_path}")
            return

        # Load model
        classifier = ExpenseClassifier()
        classifier.load_model(model_path)

        # Get model info
        info = classifier.get_model_info()
        print("\n" + "="*50)
        print("MODEL INFORMATION")
        print("="*50)
        print(json.dumps(info, indent=2, default=str))

        # Load test data
        if test_data_path and os.path.exists(test_data_path):
            test_data = load_training_data(test_data_path)
        else:
            print("No test data provided. Using sample predictions.")
            return

        # Evaluate predictions
        correct = 0
        total = len(test_data)

        print(f"\nEvaluating on {total} test samples...")

        for item in test_data:
            prediction = classifier.predict(item['description'], item.get('merchant', ''))
            if prediction['category'] == item['category']:
                correct += 1

        accuracy = correct / total if total > 0 else 0
        print(f"Test Accuracy: {accuracy:.3f} ({correct}/{total})")

    except Exception as e:
        print(f"Error during evaluation: {e}")

def main():
    """Main function to handle command line arguments and execute training."""
    parser = argparse.ArgumentParser(description='Train expense categorization model')
    parser.add_argument('--model', choices=['naive_bayes', 'random_forest', 'logistic_regression'],
                       default='naive_bayes', help='Model type to train')
    parser.add_argument('--data', type=str, help='Path to training data CSV file')
    parser.add_argument('--evaluate', action='store_true', help='Evaluate existing model')
    parser.add_argument('--test-data', type=str, help='Path to test data CSV file for evaluation')

    args = parser.parse_args()

    if args.evaluate:
        evaluate_model(test_data_path=args.test_data)
    else:
        success = train_model(model_type=args.model, data_path=args.data)
        if not success:
            sys.exit(1)

if __name__ == '__main__':
    main()
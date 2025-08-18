from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

from services.ml_service import MLService
from services.ai_service import AIService
from config import Config

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])

# Initialize services
ml_service = MLService()
ai_service = AIService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'ML Service is running',
        'version': '1.0.0'
    })

@app.route('/categorize', methods=['POST'])
def categorize_expense():
    """Categorize a single expense"""
    try:
        data = request.get_json()

        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400

        description = data['description']
        merchant = data.get('merchant', '')

        result = ml_service.categorize(description, merchant)

        return jsonify({
            'category': result['category'],
            'confidence': result['confidence'],
            'suggestions': result.get('suggestions', [])
        })

    except Exception as e:
        app.logger.error(f"Categorization error: {str(e)}")
        return jsonify({'error': 'Categorization failed'}), 500

@app.route('/categorize/bulk', methods=['POST'])
def bulk_categorize():
    """Categorize multiple expenses"""
    try:
        data = request.get_json()

        if not data or 'expenses' not in data:
            return jsonify({'error': 'Expenses array is required'}), 400

        expenses = data['expenses']

        if not isinstance(expenses, list):
            return jsonify({'error': 'Expenses must be an array'}), 400

        results = []
        for expense in expenses:
            if 'id' not in expense or 'description' not in expense:
                continue

            result = ml_service.categorize(
                expense['description'],
                expense.get('merchant', '')
            )

            results.append({
                'id': expense['id'],
                'category': result['category'],
                'confidence': result['confidence']
            })

        return jsonify({'results': results})

    except Exception as e:
        app.logger.error(f"Bulk categorization error: {str(e)}")
        return jsonify({'error': 'Bulk categorization failed'}), 500

@app.route('/suggestions', methods=['POST'])
def get_suggestions():
    """Get category suggestions for an expense"""
    try:
        data = request.get_json()

        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400

        description = data['description']
        merchant = data.get('merchant', '')

        suggestions = ml_service.get_suggestions(description, merchant)

        return jsonify({'suggestions': suggestions})

    except Exception as e:
        app.logger.error(f"Suggestions error: {str(e)}")
        return jsonify({'error': 'Failed to get suggestions'}), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train the ML model with new data"""
    try:
        data = request.get_json()

        if not data or 'data' not in data:
            return jsonify({'error': 'Training data is required'}), 400

        training_data = data['data']

        if not isinstance(training_data, list) or len(training_data) == 0:
            return jsonify({'error': 'Training data must be a non-empty array'}), 400

        result = ml_service.train_model(training_data)

        return jsonify({
            'success': True,
            'modelVersion': result['version'],
            'accuracy': result['accuracy'],
            'message': 'Model trained successfully'
        })

    except Exception as e:
        app.logger.error(f"Training error: {str(e)}")
        return jsonify({'error': 'Model training failed'}), 500

@app.route('/model/info', methods=['GET'])
def get_model_info():
    """Get model information"""
    try:
        info = ml_service.get_model_info()
        return jsonify(info)

    except Exception as e:
        app.logger.error(f"Model info error: {str(e)}")
        return jsonify({'error': 'Failed to get model info'}), 500

@app.route('/insights', methods=['POST'])
def generate_insights():
    """Generate AI insights from expense data"""
    try:
        data = request.get_json()

        if not data or 'expenses' not in data:
            return jsonify({'error': 'Expenses data is required'}), 400

        expenses = data['expenses']
        user_id = data.get('userId', 'anonymous')

        insights = ai_service.generate_insights(user_id, expenses)

        return jsonify({'insights': insights})

    except Exception as e:
        app.logger.error(f"Insights generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate insights'}), 500

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get financial recommendations"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request data is required'}), 400

        expenses = data.get('expenses', [])
        budgets = data.get('budgets', [])
        user_id = data.get('userId', 'anonymous')

        recommendations = ai_service.get_recommendations(user_id, expenses, budgets)

        return jsonify({'recommendations': recommendations})

    except Exception as e:
        app.logger.error(f"Recommendations error: {str(e)}")
        return jsonify({'error': 'Failed to get recommendations'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Method not allowed'}), 405

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    app.run(host='0.0.0.0', port=port, debug=debug)
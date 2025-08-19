from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import socket
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

# Initialize services with error handling
ml_service = None
ai_service = None

try:
    ml_service = MLService()
    print("ML Service initialized successfully")
except Exception as e:
    print(f"Warning: ML Service initialization failed: {e}")
    print("The app will run but ML features may be limited")

try:
    ai_service = AIService()
    print("AI Service initialized successfully")
except Exception as e:
    print(f"Warning: AI Service initialization failed: {e}")
    print("The app will run but AI features may be limited")

def find_free_port(start_port=5000, max_port=5100):
    """Find a free port starting from start_port"""
    for port in range(start_port, max_port):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"No free port found between {start_port} and {max_port}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'message': 'ML Service is running',
        'version': '1.0.0',
        'services': {
            'ml_service': ml_service is not None,
            'ai_service': ai_service is not None
        }
    })

@app.route('/categorize', methods=['POST'])
def categorize_expense():
    """Categorize a single expense"""
    try:
        if not ml_service:
            return jsonify({'error': 'ML Service not available'}), 503

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
        return jsonify({'error': f'Categorization failed: {str(e)}'}), 500

@app.route('/categorize/bulk', methods=['POST'])
def bulk_categorize():
    """Categorize multiple expenses"""
    try:
        if not ml_service:
            return jsonify({'error': 'ML Service not available'}), 503

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

            try:
                result = ml_service.categorize(
                    expense['description'],
                    expense.get('merchant', '')
                )

                results.append({
                    'id': expense['id'],
                    'category': result['category'],
                    'confidence': result['confidence']
                })
            except Exception as e:
                # Continue with other expenses if one fails
                app.logger.warning(f"Failed to categorize expense {expense.get('id')}: {e}")
                results.append({
                    'id': expense['id'],
                    'category': 'Uncategorized',
                    'confidence': 0.0,
                    'error': str(e)
                })

        return jsonify({'results': results})

    except Exception as e:
        app.logger.error(f"Bulk categorization error: {str(e)}")
        return jsonify({'error': f'Bulk categorization failed: {str(e)}'}), 500

@app.route('/suggestions', methods=['POST'])
def get_suggestions():
    """Get category suggestions for an expense"""
    try:
        if not ml_service:
            return jsonify({'error': 'ML Service not available'}), 503

        data = request.get_json()

        if not data or 'description' not in data:
            return jsonify({'error': 'Description is required'}), 400

        description = data['description']
        merchant = data.get('merchant', '')

        suggestions = ml_service.get_suggestions(description, merchant)

        return jsonify({'suggestions': suggestions})

    except Exception as e:
        app.logger.error(f"Suggestions error: {str(e)}")
        return jsonify({'error': f'Failed to get suggestions: {str(e)}'}), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train the ML model with new data"""
    try:
        if not ml_service:
            return jsonify({'error': 'ML Service not available'}), 503

        data = request.get_json()

        if not data or 'data' not in data:
            return jsonify({'error': 'Training data is required'}), 400

        training_data = data['data']

        if not isinstance(training_data, list) or len(training_data) == 0:
            return jsonify({'error': 'Training data must be a non-empty array'}), 400

        # Validate training data format
        for i, item in enumerate(training_data):
            if not isinstance(item, dict) or 'description' not in item or 'category' not in item:
                return jsonify({
                    'error': f'Invalid training data format at index {i}. Each item must have "description" and "category" fields'
                }), 400

        result = ml_service.train_model(training_data)

        return jsonify({
            'success': True,
            'modelVersion': result['version'],
            'accuracy': result['accuracy'],
            'message': 'Model trained successfully'
        })

    except Exception as e:
        app.logger.error(f"Training error: {str(e)}")
        return jsonify({'error': f'Model training failed: {str(e)}'}), 500

@app.route('/model/info', methods=['GET'])
def get_model_info():
    """Get model information"""
    try:
        if not ml_service:
            return jsonify({'error': 'ML Service not available'}), 503

        info = ml_service.get_model_info()
        return jsonify(info)

    except Exception as e:
        app.logger.error(f"Model info error: {str(e)}")
        return jsonify({'error': f'Failed to get model info: {str(e)}'}), 500

@app.route('/insights', methods=['POST'])
def generate_insights():
    """Generate AI insights from expense data"""
    try:
        if not ai_service:
            return jsonify({
                'insights': ['AI Service not available. Please check your configuration.']
            })

        data = request.get_json()

        if not data or 'expenses' not in data:
            return jsonify({'error': 'Expenses data is required'}), 400

        expenses = data['expenses']
        user_id = data.get('userId', 'anonymous')

        insights = ai_service.generate_insights(user_id, expenses)

        return jsonify({'insights': insights})

    except Exception as e:
        app.logger.error(f"Insights generation error: {str(e)}")
        return jsonify({
            'insights': [f'Failed to generate insights: {str(e)}']
        })

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get financial recommendations"""
    try:
        if not ai_service:
            return jsonify({
                'recommendations': ['AI Service not available. Please check your configuration.']
            })

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
        return jsonify({
            'recommendations': [f'Failed to get recommendations: {str(e)}']
        })

@app.route('/categories', methods=['GET'])
def get_categories():
    """Get available expense categories"""
    try:
        if not ml_service:
            # Return default categories if ML service is not available
            default_categories = [
                'Bills & Utilities',
                'Entertainment',
                'Food & Dining',
                'Healthcare',
                'Shopping',
                'Transportation',
                'Travel',
                'Uncategorized'
            ]
            return jsonify({'categories': default_categories})

        info = ml_service.get_model_info()
        categories = info.get('categories', [])

        return jsonify({'categories': categories})

    except Exception as e:
        app.logger.error(f"Categories error: {str(e)}")
        return jsonify({'error': f'Failed to get categories: {str(e)}'}), 500

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
    # Find a free port
    try:
        port = int(os.environ.get('PORT', 5000))

        # Check if the specified port is available
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
        except OSError:
            print(f"Port {port} is in use. Finding alternative port...")
            port = find_free_port(5001, 5100)
            print(f"Using port {port} instead")

    except Exception as e:
        print(f"Error finding port: {e}")
        port = 5001

    debug = os.environ.get('FLASK_ENV') == 'development'

    print(f"Starting Flask app on http://localhost:{port}")
    print("Available endpoints:")
    print("  GET  /health")
    print("  POST /categorize")
    print("  POST /categorize/bulk")
    print("  POST /suggestions")
    print("  POST /train")
    print("  GET  /model/info")
    print("  POST /insights")
    print("  POST /recommendations")
    print("  GET  /categories")

    app.run(host='0.0.0.0', port=port, debug=debug)
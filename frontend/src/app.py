from flask import Flask, request, jsonify
from menu_review import MenuReviewer
import os
import tempfile
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows cross-origin requests

@app.route('/api/review', methods=['POST'])
def generate_review():
    # Get form data
    api_key = request.form.get('api_key')
    task = request.form.get('task', 'summarize')
    language = request.form.get('language', 'English')
    dietary_restrictions = request.form.get('dietary_restrictions', None)
    allergies = request.form.get('allergies', None)
    culture = request.form.get('culture', None)
    
    # Check if image is in the request
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    image_file = request.files['image']
    
    # Save the uploaded image to a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    image_path = temp_file.name
    image_file.save(image_path)
    
    try:
        # Initialize the MenuReviewer and generate review
        reviewer = MenuReviewer(api_key, task, language, dietary_restrictions, allergies, culture)
        review = reviewer.generate_review(image_path)
        
        # Delete the temporary file
        os.unlink(image_path)
        
        return jsonify({'review': review})
    
    except Exception as e:
        # Delete the temporary file in case of error
        os.unlink(image_path)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
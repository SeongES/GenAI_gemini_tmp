# Add these imports at the top of your app.py file
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import time
import json
import logging
from google.cloud import speech
from menu_review import MenuReviewer

import os
API_KEY = "AIzaSyCCTK90t4X7SVmmFHHbwRtI8u5sk_b7DZE"

def transcribe_audio(audio_bytes):
    client = speech.SpeechClient()

    audio = speech.RecognitionAudio(content=audio_bytes)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,  # Match the conversion rate.
        language_code="en-US",
    )

    response = client.recognize(config=config, audio=audio)

    transcript = ""
    for result in response.results:
        transcript += result.alternatives[0].transcript + " "

    return transcript.strip()


app = Flask(__name__)

# Configure CORS to allow requests from any origin
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# Configure upload folders
UPLOAD_FOLDER = 'uploads'
AUDIO_FOLDER = 'audio_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/')
def home():
    return "Flask is running!"


# Handle image upload
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part in the request'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No image selected for uploading'}), 400
    
    filename = secure_filename(file.filename)
    # Add timestamp to ensure uniqueness
    timestamp = int(time.time())
    filename = f"{timestamp}_{filename}"
    
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    
    logger.info(f"Saved image to {file_path}")
    return jsonify({'success': True, 'image_path': file_path})

@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    try:
        logger.info("Received audio upload request")

        if 'audio' not in request.files:
            logger.error("No audio part in the request")
            return jsonify({'error': 'No audio part in the request'}), 400

        file = request.files['audio']

        if file.filename == '':
            logger.error("No audio selected for uploading")
            return jsonify({'error': 'No audio selected for uploading'}), 400

        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        filename = f"{timestamp}_{filename}"

        file_path = os.path.join(AUDIO_FOLDER, filename)
        file.save(file_path)

        logger.info(f"Saved audio to {file_path}")

        return jsonify({'success': True, 'audio_path': file_path})

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return jsonify({'error': 'Failed to process audio'}), 500

@app.route('/summarize', methods=['POST', 'OPTIONS'])
def summarize_menu():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
        
    data = request.json
    image_path = data.get("image_path")

    if not image_path:
        return jsonify({"error": "No image path provided"}), 400

    # Create a MenuReviewer instance
    reviewer = MenuReviewer(api_key=API_KEY, task="summarize", language="English",
                           dietary_restrictions=None, allergies=None, culture=None)
    
    # Generate menu summary
    summary = reviewer.generate_review(image_path)

    return jsonify({"summary": summary})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    data = request.json
    audio_path = data.get("audio_path")

    if not audio_path or not os.path.exists(audio_path):
        return jsonify({"error": "Invalid or missing audio path"}), 400

    with open(audio_path, "rb") as audio_file:
        audio_bytes = audio_file.read()

    transcription = transcribe_audio(audio_bytes)
    print('transcription', transcription)
    if transcription:
        return jsonify({"transcription": transcription})
    else:
        return jsonify({"error": "Failed to transcribe audio"}), 500
# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/audio_uploads/<filename>')
def uploaded_audio(filename):
    return send_from_directory(AUDIO_FOLDER, filename)

if __name__ == '__main__':
    # Run the app on all network interfaces (important for mobile testing)
    app.run(host='0.0.0.0', port=5000, debug=True)
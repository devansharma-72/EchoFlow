from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import os
from pymongo import MongoClient
from datetime import datetime, UTC
import speech_recognition as sr
import pyttsx3
import threading
import logging

# Set up logging (only log errors)
logging.basicConfig(level=logging.ERROR)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MongoDB connection
try:
    MONGO_URI = os.getenv("MONGO_URI")
    MONGO_DB = os.getenv("MONGO_DB")
    
    if not MONGO_URI or not MONGO_DB:
        raise ValueError("MongoDB configuration missing")
    
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    user_progress_collection = db["user_progress"]
    
    client.admin.command('ping')
except Exception as e:
    logger.error(f"MongoDB connection failed: {str(e)}")
    raise

# Configure Gemini API
try:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("Gemini API key missing")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
except Exception as e:
    logger.error(f"Gemini API configuration failed: {str(e)}")
    raise

def create_tts_engine():
    """Create a new TTS engine instance"""
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    return engine

def synthesize_speech_thread(text):
    """Run speech synthesis in a separate thread"""
    try:
        engine = create_tts_engine()
        engine.say(text)
        engine.runAndWait()
        engine.stop()
        del engine
        return True
    except Exception as e:
        logger.error(f"Speech synthesis failed: {str(e)}")
        return False

def synthesize_speech(text):
    """Helper function to convert text to speech"""
    try:
        thread = threading.Thread(target=synthesize_speech_thread, args=(text,))
        thread.start()
        return True
    except Exception as e:
        logger.error(f"Speech synthesis thread creation failed: {str(e)}")
        return False

@app.route('/api/voice-assistant', methods=['POST'])
def voice_assistant():
    try:
        data = request.json
        user_id = data.get("user_id")
        user_text = data.get("text", "")

        if not user_id or not user_text:
            return jsonify({"error": "User ID and text are required"}), 400

        prompt = f"""You are Alex, a friendly and supportive AI voice assistant created by Team EchoFlow for speech therapy. 
        Respond to: {user_text}

        Guidelines:
        - Be warm, encouraging, and patient
        - Give concise responses (under 50 words)
        - Help with speech therapy and communication improvement
        - Provide pronunciation practice and feedback
        - Be a supportive friend in the user's speech therapy journey"""

        ai_response = model.generate_content(prompt).text

        # Speech synthesis
        speech_success = synthesize_speech(ai_response)

        # Store in MongoDB
        user_progress_collection.update_one(
            {"user_id": user_id},
            {"$push": {"voice_assistant_conversations": {
                "user_text": user_text,
                "ai_response": ai_response,
                "timestamp": datetime.now(UTC),
                "speech_synthesized": speech_success
            }}},
            upsert=True
        )

        return jsonify({
            "response": ai_response,
            "speech_synthesized": speech_success
        }), 200

    except Exception as e:
        logger.error(f"Error in voice_assistant endpoint: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/voice-assistant/history/<user_id>', methods=['GET'])
def get_voice_assistant_history(user_id):
    try:
        user_data = user_progress_collection.find_one({"user_id": user_id})

        if not user_data or "voice_assistant_conversations" not in user_data:
            return jsonify({"message": "No conversations found", "conversations": []}), 200

        conversations = user_data.get("voice_assistant_conversations", [])
        return jsonify({"conversations": conversations}), 200

    except Exception as e:
        logger.error(f"Error fetching conversation history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/word-repetition/progress', methods=['POST'])
def save_word_repetition_progress():
    data = request.json
    user_id = data.get("user_id")
    accuracy = data.get("accuracy")
    words_attempted = data.get("words_attempted")
    correct_words = data.get("correct_words")
    user_speech = data.get("user_speech", "")
    target_words = data.get("target_words", [])

    if not user_id or accuracy is None or words_attempted is None:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        user_progress_collection.update_one(
            {"user_id": user_id},
            {"$push": {
                "word_repetition_progress": {
                    "accuracy": accuracy,
                    "words_attempted": words_attempted,
                    "correct_words": correct_words,
                    "user_speech": user_speech,
                    "target_words": target_words,
                    "timestamp": datetime.now(UTC)
                }
            }},
            upsert=True
        )
        return jsonify({"message": "Progress saved successfully"}), 200
    except Exception as e:
        logger.error(f"Error saving word repetition progress: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/progress/<user_id>', methods=['GET'])
def get_user_progress(user_id):
    try:
        if not user_id:
            return jsonify({"error": "User ID is missing"}), 400

        user_data = user_progress_collection.find_one({"user_id": user_id})

        if not user_data:
            return jsonify({"message": "No progress found for this user", "progress": []}), 200

        progress = user_data.get("progress", [])

        return jsonify({"progress": progress}), 200
    except Exception as e:
        logger.error(f"Error fetching user progress: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_response():
    data = request.json
    user_id = data.get("user_id")
    scenario = data.get("scenario", {})
    response = data.get("response", "")

    try:
        gemini_response = model.generate_content(
            f"Analyze the following response based on this scenario:\n"
            f"Scenario: {scenario.get('prompt')}\n"
            f"Difficulty: {scenario.get('difficulty')}\n"
            f"Word Limit: {scenario.get('wordLimit')}\n\n"
            f"Response: {response}\n"
            f"Provide constructive feedback."
        )

        feedback = gemini_response.text

        user_progress_collection.update_one(
            {"user_id": user_id},
            {"$push": {
                "progress": {
                    "scenario": scenario.get("prompt"),
                    "difficulty": scenario.get("difficulty"),
                    "response": response,
                    "feedback": feedback,
                    "timestamp": datetime.now(UTC)
                }
            }},
            upsert=True
        )

        return jsonify({
            "prompt": scenario.get("prompt"),
            "difficulty": scenario.get("difficulty"),
            "word_limit": scenario.get("wordLimit"),
            "analyzed_response": response,
            "feedback": feedback
        })
    except Exception as e:
        logger.error(f"Error in analyze_response: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.errorhandler(500)
def handle_500_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

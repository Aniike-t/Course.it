# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import google.generativeai as genai
import json
from bson import json_util 
import dotenv

app = Flask(__name__)
CORS(app) 
dotenv.load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI') 
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
GMEINI_MODEL = os.environ.get('GEMINI_MODEL')

try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping') 
    print("MongoDB connection successful.")
    db = client.track_generator 
    tracks_collection = db.tracks 
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    db = None
    tracks_collection = None



if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY environment variable not set.")
    model = None
else:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(GMEINI_MODEL)
        print("Gemini model configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini: {e}")
        model = None

def generate_track_content(track_name, description, difficulty, timeframe, num_checkpoints):
    """
    Generates track content using Gemini, formatted in a specific JSON structure,
    and leverages internet search for grounding.
    """
    if not model:
        print("Gemini model not available.")
        return None
        
    try:
        prompt = f"""
        Create a learning track about {track_name} with the following description: {description}.
        The difficulty should be {difficulty} and the timeframe to complete the track should be {timeframe}.
        The track should have {num_checkpoints} checkpoints.

        The overall response MUST be a valid JSON array of checkpoint objects. Do NOT include any text before or after the JSON array.

        Each checkpoint object in the array must have the following properties:
        "checkpointId": (integer, sequential starting from 1),
        "title": (string, a short title for the checkpoint),
        "description": (string, a detailed description of what the checkpoint covers, ideally 2-3 sentences),
        "videoUrl": (string or null, a URL to a relevant YouTube video. Search for one. If none found or not applicable, use null),
        "creatorName": (string or null, Name of the YouTube channel or creator if videoUrl is present, otherwise null),
        "outcomes": (array of strings, describing specific learning outcomes for this checkpoint. Aim for 2-4 outcomes.)

        For each checkpoint:
        - Use Google Search capabilities to find relevant YouTube video URLs, accurate descriptions, creator names, and specific learning outcomes.
        - The video URL must be a standard YouTube watch URL (e.g., https://www.youtube.com/watch?v=...). If no suitable video is found, the videoUrl MUST be null.
        - Ensure creatorName corresponds to the videoUrl. If videoUrl is null, creatorName MUST be null.
        - Ensure learning outcomes are specific and action-oriented (e.g., "Be able to...", "Understand how to...", "Identify...").
        - Format the final output strictly as a JSON array. Example for one checkpoint:
          {{
            "checkpointId": 1,
            "title": "Introduction to Topic",
            "description": "This covers the basics of the topic.",
            "videoUrl": "https://www.youtube.com/watch?v=example123",
            "creatorName": "Example Creator",
            "outcomes": ["Understand the core concept.", "Identify key terms."]
          }}
        """;

        print("Generating content with Gemini...")
        response = model.generate_content(prompt)
        
        cleaned_text = response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()

        print("--- Gemini Raw Response ---")
        print(cleaned_text)
        print("---------------------------")


        try:
            track_checkpoints = json.loads(cleaned_text)
            if not isinstance(track_checkpoints, list):
                raise ValueError("Generated content is not a JSON list.")
            if len(track_checkpoints) != num_checkpoints:
                 print(f"Warning: Generated {len(track_checkpoints)} checkpoints, requested {num_checkpoints}.")
            for i, checkpoint in enumerate(track_checkpoints):
                if not isinstance(checkpoint, dict):
                    raise ValueError(f"Checkpoint at index {i} is not a dictionary.")
                if 'checkpointId' not in checkpoint or not isinstance(checkpoint['checkpointId'], int):
                     raise ValueError(f"Invalid or missing 'checkpointId' in checkpoint {i}")
                checkpoint['checkpointId'] = i + 1

            print("Gemini response parsed and validated successfully.")
            return track_checkpoints

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error decoding or validating JSON from Gemini: {e}")
            return None

    except Exception as e:
        print(f"Error generating content with Gemini: {e}")
        return None

@app.route('/create_track', methods=['POST'])
def create_track():
    if tracks_collection is None:
         return jsonify({'message': 'Database connection error.'}), 500
         
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Invalid JSON payload.'}), 400

    track_name = data.get('track_name')
    description = data.get('description')
    difficulty = data.get('difficulty')
    timeframe = data.get('timeframe')
    num_checkpoints = data.get('num_checkpoints')

    if not all([track_name, description, difficulty, timeframe, num_checkpoints]):
         return jsonify({'message': 'Missing required fields.'}), 400

    if not isinstance(num_checkpoints, int) or num_checkpoints <= 0:
         return jsonify({'message': 'num_checkpoints must be a positive integer.'}), 400

    print("Requesting checkpoint generation...")
    track_content = generate_track_content(track_name, description, difficulty, timeframe, num_checkpoints)

    if track_content:
        track_id_string = track_name.replace(" ", "-").lower() + f"-{os.urandom(4).hex()}" 
        track_data = {
            '_id': track_id_string,
            'id': track_id_string,
            'title': track_name,
            'description': description, 
            'difficulty': difficulty,
            'timeframe': timeframe,
            'checkpoints': track_content, 
            'isUserCreated': True,
        }
        
        try:
            insert_result = tracks_collection.insert_one(track_data)
            print(f"Track saved to MongoDB with ID: {insert_result.inserted_id}")
            return jsonify(track_data), 201 
        except Exception as e:
             print(f"Error saving track to MongoDB: {e}")
             return jsonify({'message': 'Database error saving track.'}), 500
    else:
        print("Track generation failed.")
        return jsonify({'message': 'Track generation failed.'}), 500

@app.route('/get_user_tracks', methods=['GET'])
def get_user_tracks():
    if tracks_collection is None:
         return jsonify({'message': 'Database connection error.'}), 500
    try:
        user_tracks = list(tracks_collection.find({})) 
        return json.loads(json_util.dumps(user_tracks)), 200 
    except Exception as e:
        print(f"Error fetching tracks from MongoDB: {e}")
        return jsonify({'message': 'Error fetching tracks.'}), 500


if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0', port=5000) 
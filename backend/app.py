# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
import google.generativeai as genai
import json
from bson import json_util, ObjectId # Import ObjectId
import dotenv
import re

app = Flask(__name__)
CORS(app)
dotenv.load_dotenv()

MONGO_URI = os.environ.get('MONGO_URI')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL')
PVT_KEY = os.environ.get('PVT_KEY')

# --- MongoDB Connection ---
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

# --- Gemini Configuration ---
# (Keep the existing Gemini config)
if not GOOGLE_API_KEY:
    print("Warning: GOOGLE_API_KEY environment variable not set.")
    model = None
else:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        print("Gemini model configured successfully.")
    except Exception as e:
        print(f"Error configuring Gemini: {e}")
        model = None

# --- generate_track_and_flashcards function remains the same ---
# (Keep the existing function)
def generate_track_and_flashcards(track_name, description, difficulty, timeframe, num_checkpoints, num_flashcards=5):
    # ... (previous implementation) ...
    if not model:
        print("Gemini model not available.")
        return None, None # Return None for both checkpoints and flashcards

    try:
        prompt = f"""
        Generate content for a learning track about "{track_name}" described as: "{description}".
        Difficulty: {difficulty}. Estimated timeframe: {timeframe}.
        It should have exactly {num_checkpoints} checkpoints and {num_flashcards} flashcards related to the overall track topic.

        The response MUST be a single valid JSON object containing two keys: "checkpoints" and "flashcards".
        Do NOT include any text, explanations, or markdown formatting (like ```json) before or after the JSON object.

        1. "checkpoints": A JSON array of {num_checkpoints} checkpoint objects. Each checkpoint object must have:
           - "checkpointId": (integer, sequential starting from 1)
           - "title": (string, short title)
           - "description": (string, 2-3 sentences)
           - "videoUrl": (string or null, YouTube watch URL like https://www.youtube.com/watch?v=... or null if none found/applicable)
           - "creatorName": (string or null, YouTube channel name if videoUrl exists, else null)
           - "outcomes": (array of strings, 2-4 specific learning outcomes like "Understand...", "Identify...", "Be able to...")
           - Use Google Search to find relevant YouTube videos, descriptions, creators, and outcomes.

        2. "flashcards": A JSON array of {num_flashcards} flashcard objects. Each flashcard object must have:
           - "question": (string, a clear question about the track's topic)
           - "answer": (string, a concise and accurate answer)
           - "difficulty": (string, MUST be one of "easy", "medium", or "hard", based on the question's complexity)

        Example JSON structure:
        {{
          "checkpoints": [
            {{
              "checkpointId": 1,
              "title": "Intro to Topic",
              "description": "Basic concepts.",
              "videoUrl": "https://www.youtube.com/watch?v=example1",
              "creatorName": "Creator One",
              "outcomes": ["Outcome 1."]
            }},
            {{
              "checkpointId": 2,
              "title": "Advanced Concept",
              "description": "Deeper dive.",
              "videoUrl": null,
              "creatorName": null,
              "outcomes": ["Outcome A.", "Outcome B."]
            }}
          ],
          "flashcards": [
            {{
              "question": "What is the main goal?",
              "answer": "The main goal is...",
              "difficulty": "easy"
            }},
            {{
              "question": "Explain the complex part.",
              "answer": "It involves...",
              "difficulty": "hard"
            }}
          ]
        }}

        Ensure the final output is ONLY the JSON object described above.
        """

        print("Generating content with Gemini...")
        response = model.generate_content(prompt)

        # Clean the response text aggressively
        cleaned_text = response.text.strip()
        cleaned_text = re.sub(r'^```json\s*', '', cleaned_text, flags=re.IGNORECASE)
        cleaned_text = re.sub(r'\s*```$', '', cleaned_text)
        cleaned_text = cleaned_text.strip()

        print("--- Gemini Raw Response (Cleaned) ---")
        print(cleaned_text)
        print("------------------------------------")

        try:
            generated_data = json.loads(cleaned_text)
            if not isinstance(generated_data, dict): raise ValueError("Generated content is not a JSON object.")

            # --- Validate Checkpoints ---
            track_checkpoints = generated_data.get("checkpoints")
            if not isinstance(track_checkpoints, list): raise ValueError("Generated content missing or invalid 'checkpoints' list.")
            #if len(track_checkpoints) != num_checkpoints: print(f"Warning: Generated {len(track_checkpoints)} checkpoints, requested {num_checkpoints}.")

            validated_checkpoints = []
            for i, checkpoint in enumerate(track_checkpoints):
                if not isinstance(checkpoint, dict): raise ValueError(f"Checkpoint at index {i} is not a dictionary.")
                if not all(k in checkpoint for k in ["title", "description", "outcomes"]): raise ValueError(f"Checkpoint {i} missing required keys.")
                checkpoint['checkpointId'] = i + 1
                if not isinstance(checkpoint.get('outcomes'), list): checkpoint['outcomes'] = []
                if not checkpoint.get('videoUrl'):
                    checkpoint['videoUrl'] = None
                    checkpoint['creatorName'] = None
                elif not checkpoint.get('creatorName'):
                     checkpoint['creatorName'] = None
                validated_checkpoints.append(checkpoint)

            # --- Validate Flashcards ---
            flashcards = generated_data.get("flashcards")
            if not isinstance(flashcards, list):
                 print("Warning: Generated content missing or invalid 'flashcards' list. Proceeding without flashcards.")
                 flashcards = []
            # if len(flashcards) != num_flashcards: print(f"Warning: Generated {len(flashcards)} flashcards, requested {num_flashcards}.")

            validated_flashcards = []
            for i, card in enumerate(flashcards):
                 if not isinstance(card, dict):
                     print(f"Warning: Flashcard at index {i} is not a dictionary. Skipping.")
                     continue
                 if not all(k in card for k in ["question", "answer", "difficulty"]):
                      print(f"Warning: Flashcard {i} missing required keys. Skipping.")
                      continue
                 difficulty_val = str(card['difficulty']).lower()
                 if difficulty_val not in ["easy", "medium", "hard"]:
                     print(f"Warning: Flashcard {i} has invalid difficulty '{card['difficulty']}'. Defaulting to 'medium'.")
                     difficulty_val = "medium"
                 card['difficulty'] = difficulty_val
                 validated_flashcards.append(card)

            print("Gemini response parsed and validated successfully.")
            return validated_checkpoints, validated_flashcards

        except (json.JSONDecodeError, ValueError) as e:
            print(f"Error decoding or validating JSON from Gemini: {e}")
            return None, None

    except Exception as e:
        print(f"Error generating content with Gemini: {e}")
        return None, None

# --- create_track endpoint remains the same ---
# (Keep the existing function)
@app.route('/create_track', methods=['POST'])
def create_track():
    if tracks_collection is None: return jsonify({'message': 'Database connection error.'}), 500
    data = request.get_json()
    if not data: return jsonify({'message': 'Invalid JSON payload.'}), 400

    track_name = data.get('track_name')
    description = data.get('description')
    difficulty = data.get('difficulty')
    timeframe = data.get('timeframe')
    num_checkpoints = data.get('num_checkpoints')
    pvt_key = data.get('PVT_KEY')

    if pvt_key != PVT_KEY:
        print(f"Unauthorized access attempt with key: {pvt_key}")
        return jsonify({'message': 'Unauthorized access.'}), 401

    if not all([track_name, description, difficulty, timeframe, num_checkpoints]): return jsonify({'message': 'Missing required fields.'}), 400
    if not isinstance(num_checkpoints, int) or num_checkpoints <= 0: return jsonify({'message': 'num_checkpoints must be a positive integer.'}), 400

    print("Requesting checkpoint and flashcard generation...")
    track_checkpoints, track_flashcards = generate_track_and_flashcards(
        track_name, description, difficulty, timeframe, num_checkpoints
    )

    if track_checkpoints is not None:
        track_id_string = track_name.replace(" ", "-").lower() + f"-{os.urandom(4).hex()}"
        track_data = {
            '_id': track_id_string, 'id': track_id_string, 'title': track_name,
            'description': description, 'difficulty': difficulty, 'timeframe': timeframe,
            'checkpoints': track_checkpoints,
            'flashcards': track_flashcards if track_flashcards is not None else [],
            'isUserCreated': True,
        }
        try:
            insert_result = tracks_collection.insert_one(track_data)
            print(f"Track saved to MongoDB with ID: {insert_result.inserted_id}")
            return json.loads(json_util.dumps(track_data)), 201
        except Exception as e:
             print(f"Error saving track to MongoDB: {e}")
             return jsonify({'message': 'Database error saving track.'}), 500
    else:
        print("Track checkpoint generation failed.")
        return jsonify({'message': 'Track generation failed (Could not create checkpoints).'}), 500


# --- NEW ASSESSMENT ENDPOINT ---
@app.route('/assess_answer', methods=['POST'])
def assess_answer():
    if tracks_collection is None:
        return jsonify({'message': 'Database connection error.'}), 500
    if model is None:
         return jsonify({'message': 'Assessment model not available.'}), 500

    data = request.get_json()
    if not data:
        return jsonify({'message': 'Invalid JSON payload.'}), 400

    track_id = data.get('trackId')
    checkpoint_id_str = data.get('checkpointId') # Get as string initially
    user_answer = data.get('userAnswer')

    if not all([track_id, checkpoint_id_str, user_answer]):
        return jsonify({'message': 'Missing required fields (trackId, checkpointId, userAnswer).'}), 400

    # --- Find the specific checkpoint ---
    try:
        # Convert checkpointId to integer for matching within the array
        checkpoint_id_int = int(checkpoint_id_str)

        # Find the track first
        track = tracks_collection.find_one({'id': track_id})
        print(track)
        if not track:
            print(f"Assessment Error: Track not found with ID: {track_id}")
            return jsonify({'message': 'Track not found.'}), 404

        # Find the checkpoint within the track's checkpoints array
        checkpoint = None
        if 'checkpoints' in track and isinstance(track['checkpoints'], list):
            for cp in track['checkpoints']:
                # Compare checkpointId safely (handle potential type mismatch)
                if isinstance(cp, dict) and str(cp.get('checkpointId')) == str(checkpoint_id_int):
                    checkpoint = cp
                    break

        if not checkpoint:
            print(f"Assessment Error: Checkpoint {checkpoint_id_int} not found in track {track_id}")
            return jsonify({'message': 'Checkpoint not found within the track.'}), 404

        print(f"Found checkpoint for assessment: {checkpoint.get('title')}")

    except ValueError:
         print(f"Assessment Error: Invalid checkpointId format: {checkpoint_id_str}")
         return jsonify({'message': 'Invalid checkpointId format.'}), 400
    except Exception as e:
        print(f"Assessment Error: Database error finding checkpoint: {e}")
        return jsonify({'message': 'Database error finding checkpoint.'}), 500

    # --- Prepare prompt for Gemini ---
    stage_title = checkpoint.get('title', 'N/A')
    stage_description = checkpoint.get('description', 'N/A')
    stage_outcomes = checkpoint.get('outcomes', [])
    outcomes_string = "\n - ".join(stage_outcomes) if stage_outcomes else "No specific outcomes listed."

    prompt = f"""
    Context:
    Learning Stage Title: "{stage_title}"
    Stage Description: "{stage_description}"
    Learning Outcomes:
     - {outcomes_string}

    User's Answer regarding this stage:
    "{user_answer}"

    Task:
    1. Evaluate the user's answer based *only* on the provided stage context (title, description, outcomes). Does the answer demonstrate understanding of the key concepts or learning outcomes presented?
    2. Provide concise feedback (1-2 sentences maximum) explaining *why* the answer is good, bad, or partially correct in relation to the stage content. Be constructive.
    3. Provide a numerical score between 0 and 10.
       - 10: Excellent understanding, directly addresses outcomes/concepts.
       - 7-9: Good understanding, mostly correct, minor gaps.
       - 5-6: Basic understanding, grasps main idea but lacks detail or accuracy.
       - 1-4: Poor understanding, significant inaccuracies or irrelevant points.
       - 0: Completely irrelevant or no understanding shown.
       The score MUST reflect the quality and accuracy of the answer *relative to the specific stage material provided*.

    Output Format:
    Return *only* a valid JSON object with the keys "score" (integer 0-10) and "feedback" (string). Do not include any other text, explanations, or markdown formatting. Example:
    {{"score": 8, "feedback": "Good explanation of the main concept, but could mention the second outcome more directly."}}
    """

    # --- Call Gemini and Parse Response ---
    try:
        print("Sending assessment request to Gemini...")
        response = model.generate_content(prompt)

        # Clean the response text aggressively
        cleaned_text = response.text.strip()
        cleaned_text = re.sub(r'^```json\s*', '', cleaned_text, flags=re.IGNORECASE)
        cleaned_text = re.sub(r'\s*```$', '', cleaned_text)
        cleaned_text = cleaned_text.strip()

        print(f"--- Gemini Assessment Raw Response (Cleaned) ---")
        print(cleaned_text)
        print("---------------------------------------------")

        try:
            result = json.loads(cleaned_text)
            if not isinstance(result, dict) or 'score' not in result or 'feedback' not in result:
                 raise ValueError("Invalid JSON structure received from Gemini.")

            # Validate score
            score = int(result['score'])
            if not (0 <= score <= 10):
                print(f"Warning: Gemini returned score out of range ({score}). Clamping to 0-10.")
                score = max(0, min(10, score)) # Clamp the score

            feedback = str(result['feedback'])

            print(f"Assessment successful: Score={score}, Feedback='{feedback}'")
            return jsonify({'score': score, 'feedback': feedback}), 200

        except (json.JSONDecodeError, ValueError, TypeError) as parse_error:
            print(f"Error parsing Gemini assessment response: {parse_error}")
            print(f"Raw text was: {cleaned_text}")
            # Provide a default/error response to the frontend
            return jsonify({'score': 0, 'feedback': 'Assessment could not be processed automatically. Please try again.'}), 500

    except Exception as e:
        print(f"Error during Gemini assessment call: {e}")
        return jsonify({'message': 'Error during assessment evaluation.'}), 500


# --- get_user_tracks and index endpoints remain the same ---
@app.route('/get_user_tracks', methods=['GET'])
def get_user_tracks():
    if tracks_collection is None: return jsonify({'message': 'Database connection error.'}), 500
    try:
        user_tracks = list(tracks_collection.find({}))
        return json.loads(json_util.dumps(user_tracks)), 200
    except Exception as e:
        print(f"Error fetching tracks from MongoDB: {e}")
        return jsonify({'message': 'Error fetching tracks.'}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Welcome to the Track Generator API V2 (with Assessment)!'}), 200


if __name__ == '__main__':
  port = int(os.environ.get('PORT', 5000))
  app.run(debug=os.environ.get('FLASK_DEBUG', 'False').lower() == 'true', host='0.0.0.0', port=port)
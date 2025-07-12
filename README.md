# Course.it - Learning Track Gamification App

## Description

This application provides a gamified learning experience where users can follow predefined or create their own learning tracks. Users progress through checkpoints, watch associated videos, earn coins, maintain streaks, and unlock achievements and milestones. The backend is built with Python Flask and uses MongoDB, while the frontend is a React Native mobile application.

## DEMO

![Video](ProjectAssets/v3demo.mp4)

## Features

* **Learning Tracks**: Browse and follow predefined learning paths on various topics (e.g., Chess, Guitar, Poker).
* **Custom Track Creation**: Users can create their own learning tracks by providing a name, description, difficulty, timeframe, and number of checkpoints. The backend generates the content, potentially using AI and web search. Costs coins to create.
* **Checkpoint Progression**: Tracks are divided into sequential checkpoints/stages.
* **Progress Tracking**: User progress (completed checkpoints) is saved locally for each track.
* **Video Integration**: Checkpoints can include relevant YouTube videos.
* **Coin System**: Users earn coins for completing stages and spend them to create tracks. Balance is stored locally.
* **Learning Streaks**: Tracks daily completion activity to maintain a learning streak.
* **Achievements & Milestones**: Users unlock achievements based on stats (streaks, stages completed, tracks completed) and earn milestone titles. Earned achievements are stored locally.
* **Profile Page**: Displays user stats, milestones, and earned achievements.
* **Settings**: Option to clear locally stored user progress.

## Tech Stack

* **Backend**:
    * Python
    * Flask
    * MongoDB (via a `tracks_collection`)
    * AI Content Generation (Implied, likely Gemini based on `generate_track_content` function)

* **Frontend**:
    * React Native
    * Expo (likely, based on imports like `@expo/vector-icons`)
    * AsyncStorage (for local data persistence like progress, coins, streaks, achievements, cached tracks)
* **Database**:
    * MongoDB (for backend track storage)

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Aniike-t/Course.it.git
    ```
2.  **Backend Setup:**
    * Navigate to the backend directory.
    * Install Python dependencies.
    * Ensure a MongoDB instance is running and accessible. Update connection details in `backend.py` if necessary.
    * Set up any required API keys for content generation (e.g., Gemini API key).
    * Run the Flask server: `python backend.py` (or `flask run`). By default, it runs on `http://127.0.0.1:5000`.

3.  **Frontend Setup:**
    * Navigate to the frontend directory (containing `src`, `App.js`, etc.).
    * Install Node.js dependencies: `npm install` or `yarn install`.
    * Ensure the `API_BASE_URL` in `src/utils/storage.js` points to your running backend.
    * Run the React Native application: `npm start` or `yarn start` (or `npx expo start`). Follow the Expo CLI instructions to open the app on a simulator or physical device.

## API Endpoints (Backend)

* **`POST /create_track`**
    * **Description**: Creates a new learning track. Takes track details (name, description, difficulty, timeframe, number of checkpoints) in the JSON body. 
    * **Request Body**: `{ "track_name": string, "description": string, "difficulty": string, "timeframe": string, "num_checkpoints": int }`
    * **Response**: Returns the created track data as JSON with status 201 on success, or an error message with status 400/500.
* **`GET /get_user_tracks`**
    * **Description**: Retrieves all learning tracks currently stored in the MongoDB database.
    * **Response**: Returns a JSON array of track objects with status 200, or an error message with status 500.

## Frontend Components

* **Screens**:
    * `Homepage.jsx`: Displays available learning tracks and user progress. Allows navigation to tracks and settings. Includes a button to create new tracks.
    * `TrackPage.jsx`: Visualizes the checkpoints of a selected track, showing progress and allowing navigation to individual stages.
    * `StagePage.jsx`: Displays the content of a single checkpoint, including description, video (if available), and outcomes. Allows users to mark the stage as complete.
    * `PersonalTrackPage.jsx`: Form for users to input details for creating a new custom track. Handles API call to `/create_track` and coin deduction.
    * `ProfilePage.jsx`: Shows user statistics (stages completed, streak, coins, etc.), milestones, and unlocked achievements.
    * `SettingsPage.jsx`: Provides options like clearing local user data.
    * `ReportPage.jsx`: Placeholder for future reporting features.
* **Utils**:
    * `storage.js`: Handles interactions with AsyncStorage (progress, coins, track cache) and API calls to the backend.
    * `achievementHelper.js`: Logic for checking and updating earned achievements based on user stats.
    * `streakHelper.js`: Manages loading, saving, and updating the user's learning streak.
* **Data**:
    * `data.js`: Contains predefined track data.
    * `achievementsData.js`: Defines the available achievements, their criteria, and icons.

## Future Scope

* Add more uses for coins, such as:
    * Signin, Signup pages.
    * User can share tracks he created.
    * Requiring coins for editing existing tracks.
    * Purchasing profile titles or cosmetics.

* Enhance the backend's content generation grounding for video URLs as Gemini doesn't support grounding with google on free tier (potentially using Firecrawl or YouTube API directly if Gemini limitations persist).

## Acknowledgements

* Utilized Gemini for learning React-Native and coding.
* Currently MongoDB saving and loading isn't working properly so its commented out.

## Flowchart


``` mermaid
graph TD
    subgraph "User Interaction"
        User["User"]
    end

    subgraph "Frontend (React Native)"
        direction LR
        Screens["Screens (Homepage, TrackPage, StagePage, ProfilePage, PersonalTrackPage, SettingsPage)"]
        Utils["Utils (storage, streakHelper, achievementHelper)"]
        AsyncStorage[("AsyncStorage (Local Data: Progress, Coins, Streak, Achievements, User Track Cache)")]
    end

    subgraph "Backend (Flask)"
        API["Flask API - /create_track , /get_user_tracks"]
        MongoDB[("MongoDB (Track Data)")]
        ExtAPI["External Services for content generation (Gemini)"]
    end

    User --> Screens

    Screens -- Calls functions in --> Utils
    Screens -- Displays data from --> Utils

    Utils -- Reads/Writes --> AsyncStorage
    Utils -- Makes API calls --> API

    API -- Reads/Writes --> MongoDB
    API -- Calls --> ExtAPI

    %% Explicit util interactions with AsyncStorage
    subgraph "Local Data Management"
        Utils -- Manages --> AsyncStorage
    end
```
// PersonalTrackPage.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator, // Import ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadUserCreatedTracks, saveUserCreatedTracks } from '../utils/storage'; // Import cache functions

// **IMPORTANT: Use the same API_BASE_URL as defined in storage.js**
const API_BASE_URL = 'http://127.0.0.1:5000'; // Replace if needed

const PersonalTrackPage = ({ navigation }) => {
  const [trackName, setTrackName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [timeframe, setTimeframe] = useState('');
  const [checkpointsCount, setCheckpointsCount] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleCreateTrack = async () => {
    console.log("PersonalTrackPage - Attempting to create track with:", {
      trackName,
      description,
      difficulty,
      timeframe,
      checkpointsCount
    });

    // Basic validation
    if (!trackName || !description || !timeframe || !checkpointsCount) {
      Alert.alert('Input Error', 'Please fill in all fields.');
      return;
    }

    const numCheckpoints = parseInt(checkpointsCount, 10);
    if (isNaN(numCheckpoints) || numCheckpoints <= 0 || numCheckpoints > 20) { // Add upper limit?
      Alert.alert('Input Error', 'Number of checkpoints must be a valid number between 1 and 20.');
      return;
    }

    // Construct the data to send to the Flask server
    const requestData = {
      track_name: trackName,
      description: description,
      difficulty: difficulty,
      timeframe: timeframe,
      num_checkpoints: numCheckpoints
    };

    setIsLoading(true); // Start loading indicator

    try {
      console.log(`Sending POST request to ${API_BASE_URL}/create_track`);
      // Use fetchWithTimeout if desired, or standard fetch
      const response = await fetch(`${API_BASE_URL}/create_track`, { // Use API_BASE_URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Explicitly accept JSON
        },
        body: JSON.stringify(requestData),
      });

      const responseBody = await response.text(); // Get raw response text first for debugging
      console.log('Raw response:', responseBody);

      let newTrackData;
      try {
           newTrackData = JSON.parse(responseBody); // Try parsing the response
      } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            throw new Error(`Invalid JSON received from server: ${responseBody.substring(0, 100)}...`); // Show snippet
      }


      if (!response.ok) {
          // Use message from server response if available, otherwise default
          const errorMessage = newTrackData?.message || `HTTP error! Status: ${response.status}`;
          throw new Error(errorMessage);
      }


      console.log('PersonalTrackPage - Received track data from Flask:', newTrackData);

      // --- Cache the newly created track ---
      if (newTrackData && newTrackData.id) { // Ensure we have valid track data with an ID
          console.log("Attempting to update local cache with new track...");
          const currentCachedTracks = await loadUserCreatedTracks();
          // Check if track with same ID already exists (shouldn't due to unique ID generation)
          const trackExists = currentCachedTracks.some(track => track.id === newTrackData.id);
          if (!trackExists) {
              const updatedCachedTracks = [...currentCachedTracks, newTrackData];
              await saveUserCreatedTracks(updatedCachedTracks);
              console.log("New track added to local cache.");
          } else {
               console.warn("Track ID already exists in cache, skipping add.");
          }
      } else {
          console.error("Received invalid track data from server, cannot cache.", newTrackData);
          // Decide if this is a critical error or not
      }
      // --- End Caching ---

      Alert.alert('Success', 'Track created successfully!');
      navigation.goBack(); // Return to homepage

    } catch (error) {
      console.error('PersonalTrackPage - Error creating track:', error);
      Alert.alert('Error', `Failed to create track: ${error.message}`);
    } finally {
      setIsLoading(false); // Stop loading indicator regardless of outcome
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} disabled={isLoading}>
            <Ionicons name="arrow-back" size={28} color={isLoading ? "#ccc" : "#333"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Track</Text>
        </View>

        <Text style={styles.label}>Track Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Introduction to Python"
          value={trackName}
          onChangeText={setTrackName}
          editable={!isLoading}
        />

        <Text style={styles.label}>Brief Description:</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what this track will teach"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
           editable={!isLoading}
        />

        <Text style={styles.label}>Difficulty:</Text>
        <View style={styles.difficultyContainer}>
          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.difficultyButton,
                difficulty === level && styles.difficultyButtonActive,
                isLoading && styles.disabledButton // Visually disable if loading
              ]}
              onPress={() => !isLoading && setDifficulty(level)}
              disabled={isLoading}
            >
              <Text style={[
                styles.difficultyText,
                difficulty === level && styles.difficultyTextActive
              ]}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Estimated Timeframe:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 1 week, 2 days, 1 month"
          value={timeframe}
          onChangeText={setTimeframe}
          editable={!isLoading}
        />

        <Text style={styles.label}>Number of Checkpoints (1-20):</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5"
          value={checkpointsCount}
          onChangeText={setCheckpointsCount}
          keyboardType="number-pad"
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.disabledButton]} // Visually disable if loading
          onPress={handleCreateTrack}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Generate & Create Track</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF7F0',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#333333',

    marginTop: 20,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20, // Slightly smaller
    fontWeight: 'bold',
    color: '#050202',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
    color: '#444',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd', // Lighter border
    borderRadius: 8, // Slightly more rounded
    paddingHorizontal: 15,
    paddingVertical: 12, // Adjust padding
    marginBottom: 10, // More spacing
    fontSize: 16,
    color: '#333',
  },
   textArea: {
    minHeight: 80, // Ensure multiline has height
    textAlignVertical: 'top', // Align text top in Android
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons
    marginBottom: 10,
  },
  difficultyButton: {
    flex: 1, // Make buttons share space
    marginHorizontal: 4, // Add small gap
    borderWidth: 1, // Thinner border
    borderColor: '#ccc',
    backgroundColor: '#f8f8f8', // Lighter background
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center', // Center text horizontally
  },
  difficultyButtonActive: {
    backgroundColor: '#3b3b3b', // Active color
    borderColor: '#272727',
  },
  difficultyText: {
    color: '#555', // Darker grey text
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyTextActive: {
      color: '#ffffff', // White text on active
  },
  createButton: {
    backgroundColor: '#414141', // Slightly different green
    padding: 16, // Larger padding
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 0, // Add some top margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: { // Style for disabled state
      backgroundColor: '#bdc3c7', // Grey out background
      borderColor: '#bdc3c7',
      elevation: 0, // Remove shadow
      shadowOpacity: 0,
  }
});

export default PersonalTrackPage;
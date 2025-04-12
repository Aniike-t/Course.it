// PersonalTrackPage.jsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    loadUserCreatedTracks,
    saveUserCreatedTracks,
    loadUserCoins,
    saveUserCoins 
} from '../utils/storage';


const API_BASE_URL = 'https://courseitbackend.vercel.app'; 
const TRACK_CREATION_COST = 30; 
const PVT_KEY = 'aniketvm1104'   // This will be replaced when user signin signup works with token

const PersonalTrackPage = ({ navigation }) => {
  const [trackName, setTrackName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [timeframe, setTimeframe] = useState('');
  const [checkpointsCount, setCheckpointsCount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userCoins, setUserCoins] = useState(0); 
  const [coinsLoaded, setCoinsLoaded] = useState(false); 
  
  
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const coins = await loadUserCoins();
        setUserCoins(coins);
      } catch (error) {
        console.error("Failed to load user coins:", error);
        Alert.alert("Error", "Could not load your coin balance. Please try again later.");
      } finally {
          setCoinsLoaded(true); 
      }
    };
    fetchCoins();
  }, []); 

  const handleCreateTrack = async () => {
    console.log("PersonalTrackPage - Attempting to create track with:", {
      trackName, description, difficulty, timeframe, checkpointsCount
    });

    // --- Coin Check ---
    if (!coinsLoaded) {
        Alert.alert('Please wait', 'Loading your coin balance...');
        return;
    }
    if (userCoins < TRACK_CREATION_COST) {
      Alert.alert('Insufficient Funds', `You need ${TRACK_CREATION_COST} coins to create a track. You currently have ${userCoins}.`);
      return;
    }
    // --- End Coin Check ---

    // Basic validation
    if (!trackName || !description || !timeframe || !checkpointsCount) {
      Alert.alert('Input Error', 'Please fill in all fields.');
      return;
    }

    const numCheckpoints = parseInt(checkpointsCount, 10);
    if (isNaN(numCheckpoints) || numCheckpoints <= 0 || numCheckpoints > 20) {
      Alert.alert('Input Error', 'Number of checkpoints must be a valid number between 1 and 20.');
      return;
    }

    const requestData = {
      track_name: trackName, description, difficulty, timeframe,
      num_checkpoints: numCheckpoints,
      PVT_KEY: PVT_KEY
    };

    setIsLoading(true);
    const originalCoins = userCoins; 
    let coinsDeducted = false;

    try {
      // --- Deduct Coins ---
      console.log(`Attempting to deduct ${TRACK_CREATION_COST} coins from ${originalCoins}`);
      const newCoinTotal = originalCoins - TRACK_CREATION_COST;
      await saveUserCoins(newCoinTotal);
      setUserCoins(newCoinTotal); 
      coinsDeducted = true;
      console.log(`Coins deducted successfully. New balance: ${newCoinTotal}`);
      // --- End Coin Deduction ---

      console.log(`Sending POST request to ${API_BASE_URL}/create_track`);
      const response = await fetch(`${API_BASE_URL}/create_track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseBody = await response.text();
      console.log('Raw response:', responseBody);

      let newTrackData;
      try {
           newTrackData = JSON.parse(responseBody);
      } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            throw new Error(`Invalid JSON received from server: ${responseBody.substring(0, 100)}...`);
      }

      if (!response.ok) {
          const errorMessage = newTrackData?.message || `HTTP error! Status: ${response.status}`;
          throw new Error(errorMessage); // This will trigger the catch block for refund
      }

      console.log('PersonalTrackPage - Received track data from Flask:', newTrackData);

      // --- Cache the newly created track ---
      if (newTrackData && newTrackData.id) {
          console.log("Attempting to update local cache with new track...");
          const currentCachedTracks = await loadUserCreatedTracks();
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
      }
      // --- End Caching ---

      Alert.alert('Success', `Track created successfully! ${TRACK_CREATION_COST} coins deducted.`);
      navigation.goBack(); // Return to homepage

    } catch (error) {
      console.error('PersonalTrackPage - Error during track creation process:', error);

      // --- Attempt to Refund Coins if they were deducted ---
      if (coinsDeducted) {
          console.warn("Track creation failed after coins were deducted. Attempting refund...");
          try {
              await saveUserCoins(originalCoins); // Restore original coin amount
              setUserCoins(originalCoins); // Update state back
              console.log("Coins refunded successfully.");
              Alert.alert('Error & Refund', `Failed to create track: ${error.message}. Your ${TRACK_CREATION_COST} coins have been refunded.`);
          } catch (refundError) {
              console.error("CRITICAL: Failed to refund coins after track creation failure:", refundError);
              Alert.alert('Critical Error', `Failed to create track: ${error.message}. Additionally, failed to automatically refund coins. Please contact support.`);
          }
      } else {
          Alert.alert('Error', `Failed to create track: ${error.message}`);
      }
      // --- End Refund Logic ---

    } finally {
      setIsLoading(false); 
    }
  };

  const isButtonDisabled = isLoading || !coinsLoaded || userCoins < TRACK_CREATION_COST;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
        <TouchableOpacity
            onPress={() => {
              console.log('Back button pressed! isLoading:', isLoading); 
              if (!isLoading) { 
                  navigation.goBack();
              }
            }}
            style={styles.backButton}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={28} color={isLoading ? "#ccc" : "#333"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Track</Text>
          <Text style={styles.coinDisplay}>💰 {coinsLoaded ? userCoins : '...'}</Text>
        </View>

        {/* Input fields remain the same */}
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
                isLoading && styles.disabledButton 
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


        <View style={styles.createActionArea}>
            <Text style={[styles.costText, isButtonDisabled && styles.costTextDisabled]}>
                Cost: {TRACK_CREATION_COST} Coins
            </Text>
            <TouchableOpacity
              style={[styles.createButton, isButtonDisabled && styles.disabledButton]}
              onPress={handleCreateTrack}
              disabled={isButtonDisabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Generate & Create Track</Text>
              )}
            </TouchableOpacity>
            {!isLoading && !coinsLoaded && <Text style={styles.infoText}>Loading coin balance...</Text>}
            {!isLoading && coinsLoaded && userCoins < TRACK_CREATION_COST && (
                <Text style={styles.errorText}>Not enough coins!</Text>
            )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles --- 
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
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'space-between', // To space out title and coins
  },
  backButton: {
    padding: 5,
    // Removed marginRight to let space-between work
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050202',
    flex: 1, // Allow title to take up space
    textAlign: 'center', // Center title
    // marginLeft: -38, // Adjust to visually center with back button offset
  },
  coinDisplay: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#DAA520', // Gold-like color
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 5,
      backgroundColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3,
    color: '#444',
    marginTop: 8, // Add some top margin to labels
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
   textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  difficultyButton: {
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#3b3b3b',
    borderColor: '#272727',
  },
  difficultyText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  difficultyTextActive: {
      color: '#ffffff',
  },
  createActionArea: {
    marginTop: 15, // Add space above cost text/button
    alignItems: 'center', // Center items
  },
  costText: {
    textAlign:'left',
    alignSelf:'left',
      fontSize: 15,
      fontWeight: '500',
      color: '#666',
      marginBottom: 8, // Space between cost text and button
  },
  costTextDisabled: {
      color: '#aaa', // Dim the text if button is disabled
  },
  createButton: {
    backgroundColor: '#414141',
    paddingVertical: 16,
    paddingHorizontal: 30, // Give button some width
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', // Center spinner/text vertically
    minHeight: 50, // Ensure consistent height with/without spinner
    width: '100%', // Make button full width
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
  disabledButton: {
      backgroundColor: '#bdc3c7',
      borderColor: '#bdc3c7',
      elevation: 0,
      shadowOpacity: 0,
  },
  infoText: {
      marginTop: 5,
      fontSize: 13,
      color: '#666',
  },
  errorText: {
      marginTop: 5,
      fontSize: 14,
      color: '#c0392b', // Red color for errors
      fontWeight: 'bold',
  }
});

export default PersonalTrackPage;
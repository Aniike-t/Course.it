import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator, // Import ActivityIndicator
  RefreshControl, // Import RefreshControl
} from 'react-native';
// Import specific functions needed
import { getAllTracks, loadUserProgress, debugUserProgress } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const ProgressBar = ({ progress }) => {
    // ... (keep existing implementation)
    const progressWidth = Math.max(0, Math.min(100, progress * 100));
    return (
        <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
        </View>
    );
};

const Homepage = ({ navigation }) => {
    const [userProgress, setUserProgress] = useState({});
    const [allTracks, setAllTracks] = useState([]); // State to hold combined tracks
    const [isLoading, setIsLoading] = useState(true); // Loading state for tracks
    const [error, setError] = useState(null); // Error state
    const [isRefreshing, setIsRefreshing] = useState(false); // State for pull-to-refresh


    // Function to fetch all data (tracks and progress)
    const fetchData = async (showLoadingIndicator = true) => {
        if (showLoadingIndicator) setIsLoading(true);
        setError(null); // Reset error on fetch
        try {
            console.log("Homepage - Fetching all tracks...");
            const tracks = await getAllTracks(); // Use the new function
            console.log("Homepage - Tracks fetched/merged:", tracks.length);
            setAllTracks(tracks);

            console.log("Homepage - Loading user progress...");
            const progress = await loadUserProgress();
            console.log("Homepage - Progress loaded:", progress);
            setUserProgress(progress);

            // Debug - Log complete user progress when page loads/refreshes
            // await debugUserProgress();

        } catch (err) {
            console.error("Homepage - Error fetching data:", err);
            setError("Failed to load learning paths. Please try again."); // Set error message
            setAllTracks([]); // Clear tracks on error? Or show cached? Decide based on UX preference. Here clearing.
        } finally {
           if (showLoadingIndicator) setIsLoading(false);
           setIsRefreshing(false); // Ensure refreshing indicator stops
        }
    };

    // Use useFocusEffect to fetch data when the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log("Homepage focused, fetching data...");
            fetchData(); // Fetch data when screen is focused

            // Optional: Return a cleanup function if needed, but usually not for focus effect
            // return () => console.log("Homepage unfocused");
        }, []) // Empty dependency array means this runs every time the screen focuses
    );

     // Handler for pull-to-refresh
    const onRefresh = React.useCallback(() => {
        console.log("Homepage - Refresh initiated");
        setIsRefreshing(true);
        fetchData(false); // Fetch data again, don't show main loader
    }, []);


    const handleTrackPress = (trackId) => {
        console.log(`Homepage - Navigating to track: ${trackId}`);
        const trackData = allTracks.find(t => t.id === trackId); // Find the track data
        if (!trackData) {
            console.error(`Homepage - Could not find track data for ID: ${trackId}`);
            // Handle error appropriately, maybe show an alert
            return;
        }
        const completedCount = userProgress[trackId] || 0;
        console.log(`Homepage - Progress for track ${trackId}:`, completedCount);

        navigation.navigate('TrackPage', {
            trackId: trackId,
            // Pass the full track data if needed by TrackPage's initial load,
            // though TrackPage will also fetch it via getTrackById
            // trackData: trackData, // Optional: pass full track data
            completedCheckpoints: completedCount
        });
    };

    const handleSettingsPress = () => {
        console.log("Navigating to Settings");
        navigation.navigate('SettingsPage');
    };

     const handleCreateTrackPress = () => {
        console.log("Navigating to Personal Track Page");
        navigation.navigate('PersonalTrackPage'); // Navigate to the creation page
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Welcome Back</Text>
                    <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
                        <Ionicons name="settings-outline" size={28} color="#333" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.subheading}>Your Learning Paths</Text>

                {isLoading ? (
                     <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#3498db" />
                        <Text style={styles.loadingText}>Loading Paths...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centered}>
                        <Text style={styles.errorText}>{error}</Text>
                         <TouchableOpacity onPress={() => fetchData()} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                         style={styles.content}
                         refreshControl={ // Add RefreshControl
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={onRefresh}
                                colors={["#3498db"]} // Spinner color
                                tintColor={"#3498db"} // iOS spinner color
                            />
                        }
                         contentContainerStyle={allTracks.length === 0 && styles.centered} // Center if no tracks
                    >
                        {allTracks.length > 0 ? (
                            allTracks.map((track) => {
                                const totalCheckpoints = track.checkpoints?.length || 0; // Safe access to length
                                const completedCheckpoints = userProgress[track.id] || 0;
                                const progressPercent =
                                    totalCheckpoints > 0 ? completedCheckpoints / totalCheckpoints : 0;

                                return (
                                    <TouchableOpacity
                                        key={track.id}
                                        style={styles.trackCard}
                                        onPress={() => handleTrackPress(track.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.cardContent}>
                                            <Text style={styles.trackTitle}>{track.title}</Text>
                                            {totalCheckpoints > 0 ? ( // Only show progress if checkpoints exist
                                                <View style={styles.progressContainer}>
                                                    <Text style={styles.progressText}>
                                                        Progress: {completedCheckpoints} / {totalCheckpoints}
                                                    </Text>
                                                    <ProgressBar progress={progressPercent} />
                                                </View>
                                            ) : (
                                                 <Text style={styles.noCheckpointsText}>No checkpoints defined yet.</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                             !isRefreshing && // Don't show "No tracks" while refreshing
                             <Text style={styles.noTracksText}>No learning paths found. Pull down to refresh or create your own!</Text>
                        )}

                        {/* "Create Your Own Track" Section */}
                        <View style={styles.createTrackContainer}>
                             <TouchableOpacity
                                style={styles.createTrackButton}
                                onPress={handleCreateTrackPress}
                                activeOpacity={0.7}
                             >
                                <Ionicons name="add-circle-outline" size={24} color="#3498db" />
                                <Text style={styles.createTrackText}>Create Your Own Track</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 30 }} />
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  subheading:{
    fontSize: 20,
    fontWeight: 500,
    color: '#333',
    marginHorizontal: 15,
    marginTop: 10,
  },
  safeArea: {
        flex: 1,
        backgroundColor: '#FBF7F0', // Match background
  },
  container: {
    flex: 1,
  },
  header: {
    marginRight:10,
    marginleft:10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop:10,
    borderRadius:10,
    paddingTop: 15, // Adjust as needed, maybe more if status bar overlaps
    marginBottom: 10,
    borderBottomColor: '#dddddd0', // Optional: separator color
    backgroundColor: '#ffffff0', // Optional: header background color
  },
  headerTitle: {
    borderRadius:10,
    paddingTop: 15, // Adjust as needed, maybe more if status bar overlaps
    marginRight:10,
    marginleft:10,
    fontSize: 32, // Slightly adjusted size
    fontWeight: 'bold',
    color: '#333',
  },
  settingsButton: {
    paddingTop: 20,
    padding: 5,
  },
  content: {
    flex: 1,
    backgroundColor: '#FBF7F0',
    paddingTop: 10, // Add padding from header
  },
  trackCard: {
    border:'#2f2f2f0',
    borderWidth: 2,
    marginRight:10,
    marginleft:10,
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {},
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  progressContainer: {
    marginTop: 0,
  },
  progressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  createTrackContainer: {
    border:'#2f2f2f0',
    borderRadius:12,
    borderWidth: 2,
    marginHorizontal: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  createTrackButton: {
    backgroundColor: '#f0f0f00',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createTrackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3498db0',
    marginLeft: 8,
  },
});

export default Homepage;
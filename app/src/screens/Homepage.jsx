import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getAllTracks, loadUserProgress } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const ProgressBar = ({ progress }) => {
  const progressWidth = Math.max(0, Math.min(100, progress * 100));
  return (
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
    </View>
  );
};

const Homepage = ({ navigation }) => {
  const [userProgress, setUserProgress] = useState({});
  const [allTracks, setAllTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    setError(null);
    try {
      console.log("Homepage - Fetching all tracks...");
      const tracks = await getAllTracks();
      console.log("Homepage - Tracks fetched/merged:", tracks.length);
      setAllTracks(tracks);

      console.log("Homepage - Loading user progress...");
      const progress = await loadUserProgress();
      console.log("Homepage - Progress loaded:", progress);
      setUserProgress(progress);
    } catch (err) {
      console.error("Homepage - Error fetching data:", err);
      setError("Failed to load learning paths. Please try again.");
      setAllTracks([]);
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      console.log("Homepage focused, fetching data...");
      fetchData();
    }, [])
  );

  const onRefresh = React.useCallback(() => {
    console.log("Homepage - Refresh initiated");
    setIsRefreshing(true);
    fetchData(false);
  }, []);

  const handleTrackPress = (trackId) => {
    console.log(`Homepage - Navigating to track: ${trackId}`);
    const trackData = allTracks.find(t => t.id === trackId);
    if (!trackData) {
      console.error(`Homepage - Could not find track data for ID: ${trackId}`);
      return;
    }
    const completedCount = userProgress[trackId] || 0;
    console.log(`Homepage - Progress for track ${trackId}:`, completedCount);

    navigation.navigate('TrackPage', {
      trackId: trackId,
      completedCheckpoints: completedCount
    });
  };

  const handleSettingsPress = () => {
    console.log("Navigating to Settings");
    navigation.navigate('SettingsPage');
  };

  const handleCreateTrackPress = () => {
    console.log("Navigating to Personal Track Page");
    navigation.navigate('PersonalTrackPage');
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
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={["#3498db"]}
                tintColor={"#3498db"}
              />
            }
            contentContainerStyle={allTracks.length === 0 && styles.centered}
          >
            {allTracks.length > 0 ? (
              allTracks.map((track) => {
                const totalCheckpoints = track.checkpoints?.length || 0;
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
                      {totalCheckpoints > 0 ? (
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
              !isRefreshing && (
                <Text style={styles.noTracksText}>No learning paths found. Pull down to refresh or create your own!</Text>
              )
            )}

            <TouchableOpacity
              style={styles.createTrackButton}
              onPress={handleCreateTrackPress}
              activeOpacity={0.7}
            >
              <View style={styles.createTrackContent}>
                <Ionicons name="add-circle-outline" size={24} color="#3498db" />
                <Text style={styles.createTrackText}>Create Your Own Track</Text>
              </View>
            </TouchableOpacity>

              <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#333333',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#3333333',
    
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',

    letterSpacing: 0.5,
  },
  settingsButton: {
    borderWidth: 2,
    borderColor: '#333333',
    padding: 5,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: 15,
    marginTop: 0,
    marginBottom: 10,
  },
  content: {
    paddingTop: 10,
    borderWidth: 1,
borderTopLeftRadius: 25,
borderTopRightRadius: 25,
    borderTopEndRadius: 25,
    borderTopStartRadius: 25,
    borderColor: '#ffffff',
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  trackCard: {
    borderWidth: 0,
    borderColor: '#33333',
    backgroundColor: '#ededed',
    borderRadius: 15,
    marginHorizontal: 10,
    marginBottom: 7,

    padding: 20,
    // shadowColor: '#00000085',
    // shadowOffset: { width: 0, height: 3 },
    // shadowOpacity: 0.1,
    // shadowRadius: 5,
    // elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 0,
    letterSpacing: 0.3,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 5,
  },
  noCheckpointsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#777',
  },
  noTracksText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 30,
    marginHorizontal: 30,
    lineHeight: 24,
  },
  createTrackButton: {
    backgroundColor: '#ebebeb',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#3498db',
    borderStyle: 'dashed',
    marginHorizontal: 10,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  createTrackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  createTrackText: {
    fontSize: 16,
    fontWeight: "bolder",
    color: '#3498db',
    marginLeft: 10,
  },
});

export default Homepage;
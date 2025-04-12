// ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { loadUserProgress, loadUserCoins, getAllTracks } from '../utils/storage';
import { getCurrentStreak } from '../utils/streakHelper'; 
import { loadEarnedAchievements, checkForNewAchievements } from '../utils/achievementHelper'; 
import { getAchievementById } from '../data/achievementsData';

// --- Milestone Helper Functions ---
const getStageMilestone = (count) => {
  if (count >= 100) return { name: "Sage", icon: "leaf" };
  if (count >= 50) return { name: "Virtuoso", icon: "musical-notes" };
  if (count >= 25) return { name: "Trailblazer", icon: "trail-sign" };
  if (count >= 10) return { name: "Explorer", icon: "compass" };
  if (count >= 1) return { name: "Spark", icon: "flash" };
  return { name: "Initiate", icon: "radio-button-off" };
};

const getTrackMilestone = (count) => {
  if (count >= 10) return { name: "Lore Master", icon: "library" };
  if (count >= 5) return { name: "Domain Dominator", icon: "key" };
  if (count >= 1) return { name: "Syllabus Slayer", icon: "book" };
  return { name: "Aspirant", icon: "school-outline" };
};


const StatBox = ({ icon, value, label }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={32} color="#3498db" />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MilestoneBox = ({ icon, name, description }) => (
    <View style={styles.milestoneBox}>
         <Ionicons name={icon} size={40} color="#2c3e50" style={styles.milestoneIcon}/>
         <View style={styles.milestoneTextContainer}>
            <Text style={styles.milestoneName}>{name}</Text>
            <Text style={styles.milestoneDescription}>{description}</Text>
         </View>
    </View> // NO characters after this closing tag
);


const AchievementItem = ({ achievement }) => {
    // Added a check for achievement object validity
    if (!achievement) {
        return null; // Don't render if achievement data is missing
    }
    return (
        <View style={styles.achievementItem}>
            <Ionicons name={achievement.icon || 'help-circle-outline'} size={40} color="#f39c12" style={styles.achievementIcon} />
            <View style={styles.achievementTextContainer}>
            <Text style={styles.achievementName}>{achievement.name || 'Unknown Achievement'}</Text>
            <Text style={styles.achievementDescription}>{achievement.description || ''}</Text>
            </View>
        </View> // NO characters after this closing tag
    );
};
// --- End Reusable Components ---


const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStagesCompleted: 0,
    currentStreak: 0,
    totalTracksCompleted: 0,
    coins: 0,
    stageMilestone: getStageMilestone(0),
    trackMilestone: getTrackMilestone(0),
  });
  const [earnedAchievements, setEarnedAchievements] = useState([]); 

  const fetchData = async () => {
    console.log("ProfilePage: Fetching data...");
    setIsLoading(true); // Ensure loading is true at the start
    try {
      // Fetch all necessary data in parallel
      const [
        userProgressData, // Renamed to avoid conflict
        userCoinsData,    // Renamed
        allTracksData,    // Renamed
        initialEarnedAchievementIds, // Fetching IDs first
      ] = await Promise.all([
        loadUserProgress(),       // Should return {} on error/empty
        loadUserCoins(),          // Should return 0 on error/empty
        getAllTracks(),           // Should return [] on error/empty
        loadEarnedAchievements(), // Should return [] on error/empty
      ]);

      console.log("ProfilePage: Data fetched - Progress:", userProgressData, "Coins:", userCoinsData, "Tracks:", allTracksData.length, "Earned IDs:", initialEarnedAchievementIds);

      // --- Calculate Stats ---
      let calculatedTotalStages = 0;
      if (userProgressData && typeof userProgressData === 'object') {
          for (const trackId in userProgressData) {
              if (Object.prototype.hasOwnProperty.call(userProgressData, trackId)) {
                 const stageCount = Number(userProgressData[trackId]);
                 if (!isNaN(stageCount)) {
                    calculatedTotalStages += stageCount;
                 }
              }
          }
      }
      console.log("ProfilePage: Calculated total stages:", calculatedTotalStages);


      let calculatedCompletedTracks = 0;
      if (Array.isArray(allTracksData) && allTracksData.length > 0 && userProgressData && typeof userProgressData === 'object') {
          for (const trackId in userProgressData) {
               if (Object.prototype.hasOwnProperty.call(userProgressData, trackId)) {
                    const track = allTracksData.find(t => t.id === trackId);
                    if (track && Array.isArray(track.checkpoints) && track.checkpoints.length > 0) {
                        const progress = Number(userProgressData[trackId]);
                        if (!isNaN(progress) && progress >= track.checkpoints.length) {
                            calculatedCompletedTracks++;
                        }
                    }
               }
          }
      }
       console.log("ProfilePage: Calculated completed tracks:", calculatedCompletedTracks);


      const calculatedCurrentStreak = await getCurrentStreak(); // Should return 0 on error/empty
      console.log("ProfilePage: Calculated current streak:", calculatedCurrentStreak);
      const statsForAchievements = {
        totalStagesCompleted: calculatedTotalStages,
        currentStreak: calculatedCurrentStreak,
        totalTracksCompleted: calculatedCompletedTracks,
      };

      const { updatedList: currentEarnedAchievementIds, newlyEarned } = await checkForNewAchievements(
        statsForAchievements,
        initialEarnedAchievementIds
      ); 
       console.log("ProfilePage: Achievement check result - Updated IDs:", currentEarnedAchievementIds, "Newly Earned:", newlyEarned);

       if (newlyEarned && newlyEarned.length > 0) {
           console.log("ProfilePage: User just earned:", newlyEarned);
       }

      const detailedAchievementsToDisplay = currentEarnedAchievementIds
        .map(id => getAchievementById(id)) // Map over the final list of IDs
        .filter(Boolean); // Filter out any potential nulls if an ID didn't match

       console.log("ProfilePage: Detailed achievements for display:", detailedAchievementsToDisplay.length);

      // --- Update State ---
      setStats({ // Use direct set state, functional update might be overkill here unless updates are rapid
        totalStagesCompleted: calculatedTotalStages, // Use the calculated number
        currentStreak: calculatedCurrentStreak,
        totalTracksCompleted: calculatedCompletedTracks,
        coins: userCoinsData, // Use fetched coins
        stageMilestone: getStageMilestone(calculatedTotalStages),
        trackMilestone: getTrackMilestone(calculatedCompletedTracks),
      });
      setEarnedAchievements(detailedAchievementsToDisplay); // Set the array of detailed achievement objects

    } catch (error) {
      console.error("Error fetching profile data:", error);
      // Optionally set an error state to display a message to the user
    } finally {
      console.log("ProfilePage: Fetch data finished.");
      setIsLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []) 
  );
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Title */}
        <Text style={styles.pageTitle}>Your Profile Name</Text>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <StatBox icon="checkmark-done-circle-outline" value={stats.totalStagesCompleted} label="Stages Done" />
            <StatBox icon="flame-outline" value={stats.currentStreak} label="Current Streak" />
            <StatBox icon="ribbon-outline" value={stats.totalTracksCompleted} label="Tracks Mastered" />
            <StatBox icon="server-outline" value={stats.coins} label="Coins Earned" />
          </View>
        </View>

        {/* Milestones Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestoneContainer}>
              <MilestoneBox
                  icon={stats.stageMilestone.icon}
                  name={stats.stageMilestone.name}
                  description={`Based on ${stats.totalStagesCompleted} stages completed`}
              />
              <MilestoneBox
                  icon={stats.trackMilestone.icon}
                  name={stats.trackMilestone.name}
                  description={`Based on ${stats.totalTracksCompleted} tracks completed`}
              />
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {/* Conditional Rendering for Achievements */}
          {earnedAchievements.length > 0 ? (
            earnedAchievements.map((ach) => (
              // Render AchievementItem only if 'ach' is a valid object
              ach ? <AchievementItem key={ach.id} achievement={ach} /> : null
            ))
          ) : (
            <Text style={styles.noAchievementsText}>No achievements unlocked yet. Keep learning!</Text>
          )}
        </View>

         {/* Bottom Spacer */}
         <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  ); // End of return
}; // End of ProfilePage component

// --- Styles ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FBF7F0',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#555',
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
    textAlign: 'left',
  },
  section: {
    borderWidth: 3,
    borderRadius: 12,
    borderColor: '#2c2c2c',
    marginBottom: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around', // Distribute boxes
  },
  statBox: {
    borderWidth: 3,
    borderRadius: 12,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    width: '45%',
    marginBottom: 20,
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 3,
    textAlign: 'center',
  },
  milestoneContainer: {
     // Add styles if needed, maybe space between milestone boxes
  },
   milestoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15, // Space between milestone boxes
  },
  milestoneIcon: {
      marginRight: 15,
  },
  milestoneTextContainer:{
      flex: 1, // Take remaining space
  },
  milestoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  milestoneDescription: {
      fontSize: 13,
      color: '#555',
      marginTop: 2,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffaf0', // Light background for achievements
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#f39c12',
  },
  achievementIcon: {
    marginRight: 15,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  noAchievementsText: {
      fontSize: 14,
      color: '#777',
      textAlign: 'center',
      marginTop: 10,
      fontStyle: 'italic',
  }
});

export default ProfilePage;
// src/utils/achievementHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';
// Adjust the path if your achievements data is located elsewhere
import { achievementsList } from '../data/achievementsData.js';

const EARNED_ACHIEVEMENTS_KEY = '@userEarnedAchievements';

/**
 * Loads the list of earned achievement IDs from AsyncStorage.
 * @returns {Promise<string[]>} An array of earned achievement IDs.
 */
export const loadEarnedAchievements = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(EARNED_ACHIEVEMENTS_KEY);
    const earnedIds = jsonValue != null ? JSON.parse(jsonValue) : [];
    // Ensure it's always an array
    return Array.isArray(earnedIds) ? earnedIds : [];
  } catch (e) {
    console.error("Failed to load earned achievements:", e);
    return []; // Return empty array on error
  }
};

/**
 * Saves the list of earned achievement IDs to AsyncStorage.
 * @param {string[]} earnedIds - The array of achievement IDs to save.
 */
export const saveEarnedAchievements = async (earnedIds) => {
  try {
    // Ensure we're saving an array
    if (!Array.isArray(earnedIds)) {
        console.error("Invalid data provided to saveEarnedAchievements: not an array.", earnedIds);
        return;
    }
    const jsonValue = JSON.stringify(earnedIds);
    await AsyncStorage.setItem(EARNED_ACHIEVEMENTS_KEY, jsonValue);
    console.log("Earned achievements saved:", earnedIds);
  } catch (e) {
    console.error("Failed to save earned achievements:", e);
  }
};

/**
 * Checks current stats against achievement criteria and updates the stored list.
 *
 * @param {object} currentStats - An object containing the user's current statistics
 *                                (e.g., { totalStagesCompleted: 10, currentStreak: 3, ... }).
 * @param {string[]} [currentlyEarnedIds=null] - Optional: The currently known list of earned IDs.
 *                                              If null, it will be loaded internally.
 * @returns {Promise<{ updatedList: string[], newlyEarned: string[] }>}
 *          An object containing the full updated list of earned IDs and
 *          an array of IDs that were newly earned in this check.
 */
export const checkForNewAchievements = async (currentStats, currentlyEarnedIds = null) => {
  const earnedIds = currentlyEarnedIds === null ? await loadEarnedAchievements() : currentlyEarnedIds;
  const newlyEarnedIds = [];

  if (!achievementsList || !Array.isArray(achievementsList)) {
      console.error("Achievements list is missing or not an array.");
      return { updatedList: earnedIds, newlyEarned: [] };
  }

  console.log("Checking for new achievements. Current stats:", currentStats, "Already earned:", earnedIds);

  achievementsList.forEach(achievement => {
    // Check if:
    // 1. Achievement exists and has an ID and criteria function
    // 2. It's NOT already in the earned list
    if (achievement && achievement.id && typeof achievement.criteria === 'function' && !earnedIds.includes(achievement.id)) {
      try {
        // 3. The criteria function returns true based on current stats
        if (achievement.criteria(currentStats)) {
          console.log(`Achievement unlocked: ${achievement.name} (${achievement.id})`);
          newlyEarnedIds.push(achievement.id);
        }
      } catch (error) {
        console.error(`Error evaluating criteria for achievement ${achievement.id}:`, error);
      }
    }
  });

  if (newlyEarnedIds.length > 0) {
    console.log("Newly earned achievements:", newlyEarnedIds);
    const updatedList = [...earnedIds, ...newlyEarnedIds];
    await saveEarnedAchievements(updatedList);
    return { updatedList: updatedList, newlyEarned: newlyEarnedIds };
  } else {
    // No new achievements, return the original list
    return { updatedList: earnedIds, newlyEarned: [] };
  }
};

/**
 * Resets earned achievements (for debugging or specific user actions).
 */
export const resetAchievements = async () => {
    try {
        await AsyncStorage.removeItem(EARNED_ACHIEVEMENTS_KEY);
        console.log("Earned achievements reset.");
    } catch (e) {
        console.error("Failed to reset achievements:", e);
    }
};
// src/utils/streakHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_DATA_KEY = '@userStreakData';

/**
 * Gets the current date as a string in 'YYYY-MM-DD' format.
 */
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Gets the date for yesterday as a string in 'YYYY-MM-DD' format.
 */
const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

/**
 * Loads streak data from AsyncStorage.
 * @returns {Promise<{lastCompletionDate: string | null, currentStreak: number}>}
 */
export const loadStreakData = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STREAK_DATA_KEY);
    const data = jsonValue != null ? JSON.parse(jsonValue) : null;
    // Return default structure if no data or data is malformed
    return {
      lastCompletionDate: data?.lastCompletionDate || null,
      currentStreak: data?.currentStreak || 0,
    };
  } catch (e) {
    console.error("Failed to load streak data:", e);
    return { lastCompletionDate: null, currentStreak: 0 }; // Return default on error
  }
};

/**
 * Saves streak data to AsyncStorage.
 * @param {{lastCompletionDate: string, currentStreak: number}} streakData
 */
export const saveStreakData = async (streakData) => {
  try {
    // Basic validation
    if (!streakData || typeof streakData.lastCompletionDate !== 'string' || typeof streakData.currentStreak !== 'number') {
        console.error("Invalid streak data provided to saveStreakData:", streakData);
        return;
    }
    const jsonValue = JSON.stringify(streakData);
    await AsyncStorage.setItem(STREAK_DATA_KEY, jsonValue);
    console.log("Streak data saved:", streakData);
  } catch (e) {
    console.error("Failed to save streak data:", e);
  }
};

/**
 * Updates the user's streak based on a new completion.
 * This should be called *after* a stage/task is successfully marked as complete.
 * @returns {Promise<{lastCompletionDate: string, currentStreak: number}>} The updated streak data.
 */
export const updateStreakOnCompletion = async () => {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const currentData = await loadStreakData();

  let newStreak = 0;
  let newLastCompletionDate = today; // Assume today is the new completion date

  if (!currentData.lastCompletionDate) {
    // No previous completions, start a new streak
    console.log("Streak Helper: Starting first streak.");
    newStreak = 1;
  } else if (currentData.lastCompletionDate === today) {
    // Already completed today, streak doesn't change
    console.log("Streak Helper: Already completed today, streak continues.");
    newStreak = currentData.currentStreak;
    // Keep newLastCompletionDate as today
  } else if (currentData.lastCompletionDate === yesterday) {
    // Completed yesterday, increment streak
    console.log("Streak Helper: Completed yesterday, incrementing streak.");
    newStreak = (currentData.currentStreak || 0) + 1;
     // Keep newLastCompletionDate as today
  } else {
    // Streak broken (gap of more than one day)
    console.log(`Streak Helper: Streak broken. Last completion: ${currentData.lastCompletionDate}, Today: ${today}. Resetting.`);
    newStreak = 1; // Reset to 1 for today's completion
     // Keep newLastCompletionDate as today
  }

  const updatedData = {
    lastCompletionDate: newLastCompletionDate,
    currentStreak: newStreak,
  };

  await saveStreakData(updatedData);
  return updatedData;
};


/**
 * Gets the current valid streak count, checking if it's broken.
 * Useful primarily for display purposes.
 * @returns {Promise<number>} The current streak count (0 if broken).
 */
export const getCurrentStreak = async () => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const currentData = await loadStreakData();

    if (!currentData.lastCompletionDate) {
        return 0; // No completions yet
    }

    if (currentData.lastCompletionDate === today || currentData.lastCompletionDate === yesterday) {
        // Streak is active if last completion was today or yesterday
        return currentData.currentStreak || 0;
    } else {
        // Streak is broken if last completion was before yesterday
        console.log("getCurrentStreak: Streak appears broken.");
        return 0;
    }
};

/**
 * Resets streak data (for debugging or specific user actions).
 */
export const resetStreakData = async () => {
    try {
        await AsyncStorage.removeItem(STREAK_DATA_KEY);
        console.log("Streak data reset.");
    } catch (e) {
        console.error("Failed to reset streak data:", e);
    }
};
// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tracksData as bundledTracksData } from '../data/data.js';

// --- Constants ---
const USER_PROGRESS_KEY = '@userProgress';
const USER_COINS_KEY = '@userCoins';
const USER_CREATED_TRACKS_KEY = '@userCreatedTracks'; // Key for cached user tracks
const API_BASE_URL = 'https://courseitbackend.vercel.app';
// const API_BASE_URL = 'http://127.0.0.1:5000'

// --- Helper Function for API calls ---
const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            console.error(`Request timed out: ${url}`);
            throw new Error('Request timed out');
        }
        console.error(`Workspace error in fetchWithTimeout: ${error.message}`); // More specific log
        throw error; // Re-throw other errors
    }
};


// --- User Progress ---
export const loadUserProgress = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(USER_PROGRESS_KEY);
        const storedData = jsonValue != null ? JSON.parse(jsonValue) : {};
        return storedData.progress || {}; // Return only the progress data
    } catch (e) {
        console.error("Failed to load user progress:", e);
        return {};
    }
};

export const saveUserProgress = async (progressData) => {
    try {
        const timestamp = new Date().toISOString(); // Using ISO 8601 format
        const dataToSave = {
            progress: progressData,
            timestamp: timestamp,
        };
        const jsonValue = JSON.stringify(dataToSave);
        await AsyncStorage.setItem(USER_PROGRESS_KEY, jsonValue);
        console.log("Progress saved successfully:", dataToSave);
    } catch (e) {
        console.error("Failed to save user progress:", e);
    }
};

export const updateTrackProgress = async (trackId, completedCheckpointId) => {
    try {
        const currentProgress = await loadUserProgress();
        const newCompletedCount = Number(completedCheckpointId);
        if (newCompletedCount > (currentProgress[trackId] || 0)) {
            const updatedProgress = { ...currentProgress, [trackId]: newCompletedCount };
            await saveUserProgress(updatedProgress);
            console.log(`Updated progress for track ${trackId} to checkpoint count ${newCompletedCount}`);
        } else {
            console.log(`Checkpoint ${completedCheckpointId} already completed or lower for track ${trackId}. No update needed.`);
        }
    } catch (e) {
        console.error(`Failed to update progress for track ${trackId}:`, e);
    }
};


// --- User Coins ---
export const loadUserCoins = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(USER_COINS_KEY);
        const storedData = jsonValue != null ? JSON.parse(jsonValue) : {};
        return storedData.coins || 0;
    } catch (e) {
        console.error("Failed to load user coins:", e);
        return 0;
    }
};

export const saveUserCoins = async (coinCount) => {
    try {
        const timestamp = new Date().toISOString();
        const dataToSave = {
            coins: coinCount,
            timestamp: timestamp,
        };
        const jsonValue = JSON.stringify(dataToSave);
        await AsyncStorage.setItem(USER_COINS_KEY, jsonValue);
    } catch (e) {
        console.error("Failed to save user coins:", e);
    }
};

export const addUserCoins = async (amountToAdd) => {
    try {
        const currentCoins = await loadUserCoins();
        const newTotal = currentCoins + amountToAdd;
        await saveUserCoins(newTotal);
        console.log(`Added ${amountToAdd} coins. New total: ${newTotal}`);
    } catch (e) {
        console.error(`Failed to add ${amountToAdd} coins:`, e);
    }
};


// --- User Created Tracks (Cache) ---

/**
 * Loads user-created tracks from AsyncStorage cache.
 * Returns an empty array if nothing is found or an error occurs.
 */
export const loadUserCreatedTracks = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(USER_CREATED_TRACKS_KEY);
        const storedData = jsonValue != null ? JSON.parse(jsonValue) : {};
        return storedData.tracks || [];
    } catch (e) {
        console.error("Failed to load user-created tracks from cache:", e);
        return [];
    }
};

/**
 * Saves an array of user-created tracks to AsyncStorage cache.
 * @param {Array} tracks The array of user-created track objects.
 */
export const saveUserCreatedTracks = async (tracks) => {
    try {
        const timestamp = new Date().toISOString();
        const dataToSave = {
            tracks: tracks,
            timestamp: timestamp,
        };
        const jsonValue = JSON.stringify(dataToSave);
        await AsyncStorage.setItem(USER_CREATED_TRACKS_KEY, jsonValue);
        console.log("User-created tracks saved to cache successfully:", tracks.length, "tracks at", timestamp);
    } catch (e) {
        console.error("Failed to save user-created tracks to cache:", e);
    }
};

// --- Combined Track Data ---

let allTracksCache = null;

/**
 * Fetches user tracks from server, updates cache, merges with predefined tracks.
 * Prioritizes server data, falls back to cache, then just predefined.
 * @returns {Promise<Array>} A promise that resolves with the combined array of all tracks.
 */
export const getAllTracks = async () => {
    console.log("getAllTracks called");
    let userTracks = [];

    // --- Backend Fetch Disabled ---
    // try {
    //     console.log("Attempting to fetch user tracks from server...");
    //     const response = await fetchWithTimeout(`${API_BASE_URL}/get_user_tracks`);
    //     console.log(response)

    //     if (!response.ok) {
    //         let errorBody = null;
    //         try { errorBody = await response.json(); } catch (e) { }
    //         const statusText = response.statusText || 'Unknown Status';
    //         const errorMessage = errorBody?.message || `HTTP error! Status: ${response.status} (${statusText})`;
    //         throw new Error(errorMessage);
    //     }
    //     const serverTracks = await response.json();
    //     console.log(`Successfully fetched ${serverTracks.length} tracks from server.`);

    //     if (Array.isArray(serverTracks)) {
    //         userTracks = serverTracks;
    //         console.log(serverTracks)
    //         await saveUserCreatedTracks(userTracks); // Update local cache
    //     } else {
    //         console.error("Server response is not an array:", serverTracks);
    //         // Fallback to cache will happen in catch block or after this try
    //     }

    // } catch (error) {
    //     console.error("Failed to fetch tracks from server:", error.message); // Log the specific error
    //     // Fallback: Try loading from local cache if server fetch failed
    //     console.log("Falling back to loading user tracks from cache...");
    //     try {
    //         userTracks = await loadUserCreatedTracks();
    //         console.log(`Loaded ${userTracks.length} tracks from cache.`);
    //     } catch (cacheError) {
    //         console.error("Failed to load tracks from cache as well:", cacheError);
    //         userTracks = []; // Ensure userTracks is an empty array if cache fails too
    //     }
    // }
    // --- End Backend Fetch Disabled ---

    // --- Always load from cache ---
    console.log("Loading user tracks from cache...");
    try {
        userTracks = await loadUserCreatedTracks();
        console.log(`Loaded ${userTracks.length} tracks from cache.`);
    } catch (cacheError) {
        console.error("Failed to load tracks from cache:", cacheError);
        userTracks = []; // Ensure userTracks is an empty array if cache fails
    }
    // --- End Always load from cache ---


    // Merge predefined and user tracks.
    const combinedTracksMap = new Map();

    // Add predefined tracks first
    bundledTracksData.forEach(track => {
        // Basic check for valid track structure
        if (track && track.id) {
            combinedTracksMap.set(track.id, track);
        } else {
            console.warn("Skipping invalid predefined track:", track);
        }
    });

    // Add user tracks (loaded from cache)
    if (Array.isArray(userTracks)) {
        userTracks.forEach(track => {
            // Basic check for valid track structure
            if (track && track.id) {
                combinedTracksMap.set(track.id, track);
            } else {
                console.warn("Skipping invalid user track:", track);
            }
        });
    } else {
        console.error("User tracks data is not an array after cache attempt:", userTracks);
    }


    const combinedTracks = Array.from(combinedTracksMap.values());
    console.log(`Total combined tracks after merge: ${combinedTracks.length}`);

    allTracksCache = combinedTracks; // Update in-memory cache
    return combinedTracks;
};

// ... (getTrackById, debugUserProgress, clearUserData implementations) ...
export const getTrackById = async (trackId) => {
    console.log(`getTrackById called for: ${trackId}`);
    const tracksToSearch = allTracksCache ? allTracksCache : await getAllTracks();

    if (!Array.isArray(tracksToSearch)) {
        console.error("Cannot search for track, track data is not an array.");
        return null;
    }

    const foundTrack = tracksToSearch.find(track => track.id === trackId);
    if (!foundTrack) {
        console.warn(`Track with ID ${trackId} not found in combined list.`);
    }
    return foundTrack || null;
};

export const debugUserProgress = async () => {
    try {
        const storedData = await AsyncStorage.getItem(USER_PROGRESS_KEY);
        const progressWithTimestamp = storedData != null ? JSON.parse(storedData) : {};
        console.log('====== USER PROGRESS DEBUG ======');
        console.log(JSON.stringify(progressWithTimestamp, null, 2));
        console.log('=================================');
        return progressWithTimestamp;
    } catch (e) {
        console.error('Debug error:', e);
        return null;
    }
};

export const clearUserData = async () => {
    try {
        await AsyncStorage.removeItem(USER_PROGRESS_KEY);
        await AsyncStorage.removeItem(USER_COINS_KEY);
        await AsyncStorage.removeItem(USER_CREATED_TRACKS_KEY);
        allTracksCache = null;
        console.log('User progress, coins, and cached user tracks cleared.');
    } catch (e) {
        console.error("Failed to clear user data:", e);
    }
};
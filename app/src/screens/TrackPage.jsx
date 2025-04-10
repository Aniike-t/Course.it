import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    useWindowDimensions,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useFocusEffect } from '@react-navigation/native';

// Import getTrackById function instead of tracksData
import { loadUserCoins, saveUserProgress, loadUserProgress, getTrackById } from "../utils/storage";

// --- Constants (keep or adjust as needed) ---
const CHECKPOINT_HEIGHT_ESTIMATE = 80; // Adjust as needed
const CHECKPOINT_VERTICAL_MARGIN = 40; // Adjust as needed
const HORIZONTAL_PADDING = 20;
const CHECKPOINT_AREA_WIDTH_PERCENT = 45; // Percent of screen width for the checkpoint area
const SCROLL_OFFSET = 100; // How far above the checkpoint to scroll

const TrackPage = ({ route, navigation }) => {
    const { trackId, completedCheckpoints: initialCompletedCheckpoints } = route.params || {};
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [checkpointLayouts, setCheckpointLayouts] = useState({});
    const [didInitialScroll, setDidInitialScroll] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(initialCompletedCheckpoints || 0);
    const [coins, setCoins] = useState(0);
    const scrollViewRef = useRef(null);

    const [track, setTrack] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load track data using getTrackById
    useEffect(() => {
        async function loadTrackData() {
            if (!trackId) {
                console.log("TrackPage: No trackId provided.");
                setIsLoading(false);
                setTrack(null); // Ensure track is null if no ID
                return;
            }

            setIsLoading(true);
            try {
                console.log(`TrackPage: Fetching track with ID: ${trackId}`);
                const trackData = await getTrackById(trackId);

                if (trackData) {
                    console.log(`TrackPage: Successfully loaded track: ${trackData.title}`);
                    setTrack(trackData);
                } else {
                    console.warn(`TrackPage: Track with ID ${trackId} not found!`);
                    setTrack(null); // Set track to null if not found
                }
            } catch (error) {
                console.error(`TrackPage: Error loading track ${trackId}:`, error);
                setTrack(null); // Set track to null on error
            } finally {
                setIsLoading(false);
            }
        }

        loadTrackData();
    }, [trackId]);

    // Calculate reversed checkpoints and total count when track changes
    const reversedCheckpoints = track?.checkpoints ? [...track.checkpoints].reverse() : [];
    const totalCheckpoints = track?.checkpoints?.length || 0;

    // Calculate estimated content height
    const estimatedContentHeight =
        reversedCheckpoints.length * (CHECKPOINT_HEIGHT_ESTIMATE + CHECKPOINT_VERTICAL_MARGIN) +
        CHECKPOINT_VERTICAL_MARGIN; // Add margin for the first item too

    // Calculate path points
    const pathPoints = useMemo(() => {
        const points = [];
        const checkpointAreaWidth = windowWidth * (CHECKPOINT_AREA_WIDTH_PERCENT / 100);
        const availableSpace = windowWidth - 2 * HORIZONTAL_PADDING;

        reversedCheckpoints.forEach((checkpoint, index) => {
            const y =
                index * (CHECKPOINT_HEIGHT_ESTIMATE + CHECKPOINT_VERTICAL_MARGIN) +
                CHECKPOINT_VERTICAL_MARGIN / 2 + // Center point within the vertical space
                CHECKPOINT_HEIGHT_ESTIMATE / 2;
            const isAlignedLeft = index % 2 !== 0;
            let x;
            if (isAlignedLeft) {
                x = HORIZONTAL_PADDING + checkpointAreaWidth / 2;
            } else {
                x = HORIZONTAL_PADDING + availableSpace - checkpointAreaWidth / 2;
            }

            if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
                points.push({ x, y });
            } else {
                console.warn("Invalid coordinates generated for path point", { x, y, index });
            }
        });
        return points;
    }, [reversedCheckpoints, windowWidth]);

    // Progress saving function
    const saveProgressLocal = async (newProgressCount) => {
        if (!trackId) return;
        try {
            console.log(`TrackPage: Saving progress for ${trackId}. New count: ${newProgressCount}`);
            const allProgress = await loadUserProgress();
            const updatedAllProgress = {
                ...allProgress,
                [trackId]: newProgressCount,
            };
            await saveUserProgress(updatedAllProgress);
        } catch (e) {
            console.error(`TrackPage: Error saving progress for ${trackId}:`, e);
            Alert.alert("Error", "Could not save your progress.");
        }
    };

    // Focus effect for coins and progress
    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;

            const fetchCoinsAndProgress = async () => {
                console.log("TrackPage: Focus effect - fetching coins and progress");
                if (!trackId) {
                    console.log("TrackPage: Focus effect - no trackId, skipping fetch.");
                    setCoins(await loadUserCoins()); // Still load coins
                    return;
                }
                try {
                    const loadedCoins = await loadUserCoins();
                    const progress = await loadUserProgress();
                    if (isActive) {
                        setCoins(loadedCoins);
                        const newProgress = progress[trackId] || 0;
                        // Only update state if the value actually changes to prevent unnecessary re-renders
                        if (newProgress !== currentProgress) {
                             console.log(`TrackPage: Progress updated externally for ${trackId} from ${currentProgress} to ${newProgress}`);
                             setCurrentProgress(newProgress);
                             // Reset initial scroll flag if progress changes externally, allowing scroll to new 'next'
                             setDidInitialScroll(false);
                        } else {
                            console.log(`TrackPage: Progress for ${trackId} hasn't changed externally (${newProgress}).`);
                        }
                    }
                } catch (error) {
                    console.error("TrackPage: Error in focus effect fetch:", error);
                }
            };

            fetchCoinsAndProgress();

            return () => {
                isActive = false;
                console.log("TrackPage: Focus effect cleanup");
            };
        }, [trackId, currentProgress]) // Depend on currentProgress to refetch if it changes internally
    );

    // Effect for handling completed stages coming back from StagePage
     useEffect(() => {
        // Ensure we have the necessary data and the params are for *this* track
        if (!track || !track.checkpoints || !route.params?.completedStageId || route.params?.trackId !== trackId) {
            return;
        }

        console.log("TrackPage: Completion effect - Checking route.params:", route.params);
        const completedCheckpointId = route.params.completedStageId;

        // Find the original index (0-based) of the completed checkpoint in the non-reversed array
        const completedOriginalIndex = track.checkpoints.findIndex(
            (cp) => cp.checkpointId.toString() === completedCheckpointId.toString()
        );
        console.log(`TrackPage: Completion effect - Original index of completed stage: ${completedOriginalIndex}`);

        if (completedOriginalIndex === -1) {
            console.warn(`TrackPage: Completed checkpoint ID ${completedCheckpointId} not found in track ${trackId}.`);
             // Clean up the parameter even if not found
            navigation.setParams({ completedStageId: null, trackId: null });
            return;
        }

        // Check if this completion corresponds to the *expected next* stage
        const expectedCompletedIndex = currentProgress;
        console.log(`TrackPage: Completion effect - Expected index for next completion: ${expectedCompletedIndex}`);

        if (completedOriginalIndex === expectedCompletedIndex) {
            const newProgressCount = currentProgress + 1;
            console.log(`TrackPage: Completion effect - Correct stage completed. Updating progress to: ${newProgressCount}`);
            setCurrentProgress(newProgressCount); // Update UI immediately
            saveProgressLocal(newProgressCount); // Save persistently

            // Scroll to the *new* next checkpoint (if it exists)
            // Use a timeout to allow layout updates and state propagation
            setTimeout(() => {
                const nextOriginalIndex = newProgressCount;
                if (nextOriginalIndex < totalCheckpoints) {
                    const layoutKey = nextOriginalIndex;
                    const nextLayout = checkpointLayouts[layoutKey];

                    console.log(`TrackPage: Scrolling check after completion. nextOriginalIndex: ${nextOriginalIndex}`);

                    if (nextLayout && scrollViewRef.current) {
                        const targetY = Math.max(0, nextLayout.y - SCROLL_OFFSET);
                        console.log(`TrackPage: Scrolling to next checkpoint layout at y=${nextLayout.y}, targetY=${targetY}`);
                        scrollViewRef.current.scrollTo({ y: targetY, animated: true });
                    } else {
                        console.warn("TrackPage: Next checkpoint layout not found or scrollRef not ready for scroll after completion. Layouts:", checkpointLayouts);
                    }
                } else {
                    console.log("TrackPage: All checkpoints completed after this one. No next checkpoint to scroll to.");
                    // Optionally scroll to the last completed item or top/bottom
                }
            }, 400); // Increased timeout slightly
        } else {
            console.log(`TrackPage: Completion effect - Completed stage index (${completedOriginalIndex}) does not match expected (${expectedCompletedIndex}). Likely a revisit or out-of-order completion. No progress update.`);
        }

        // Clean up the parameter regardless of whether progress was updated, to avoid re-triggering
        console.log("TrackPage: Completion effect - Clearing completedStageId/trackId params.");
        navigation.setParams({ completedStageId: null, trackId: null });

    }, [route.params?.completedStageId, route.params?.trackId, trackId, currentProgress, track, checkpointLayouts, navigation, totalCheckpoints]); // Added totalCheckpoints dependency


    // Checkpoint press handler - *** MODIFIED ***
    const handleCheckpointPress = (checkpoint, originalIndex, isPressableFlag) => {
        // Use the pre-calculated pressable flag
        if (!isPressableFlag) {
            console.log(`TrackPage: Click prevented on locked checkpoint: ${checkpoint.checkpointId} (index ${originalIndex})`);
            return; // Exit if not pressable
        }

        const isRevisit = originalIndex < currentProgress; // Check if it's a completed one being revisited
        console.log(`TrackPage: Navigating to StagePage for checkpoint ID: ${checkpoint.checkpointId} (index ${originalIndex}) - Revisit: ${isRevisit}`);
        navigation.navigate("StagePage", {
            trackId: trackId,
            checkpoint: checkpoint,
            isRevisit: isRevisit, // Optionally pass this info to StagePage
        });
    };

    // Initial scroll to next checkpoint
    useEffect(() => {
        // Conditions: track loaded, has checkpoints, initial scroll not done, and layouts are ready
        if (track && totalCheckpoints > 0 && !didInitialScroll && Object.keys(checkpointLayouts).length >= totalCheckpoints) {
            const nextOriginalIndex = currentProgress;

            // Only scroll if there *is* a next checkpoint
            if (nextOriginalIndex < totalCheckpoints) {
                const layoutKey = nextOriginalIndex; // Key corresponds to original index
                const layout = checkpointLayouts[layoutKey];
                console.log(`TrackPage: Initial scroll check. Target index: ${nextOriginalIndex}, Layout found:`, !!layout);

                if (layout && scrollViewRef.current) {
                     // Use timeout to ensure layout is fully stable after potentially rapid updates
                    setTimeout(() => {
                        if (scrollViewRef.current) { // Check ref again inside timeout
                            const targetY = Math.max(0, layout.y - SCROLL_OFFSET);
                            console.log(`TrackPage: Performing initial scroll to y=${layout.y}, targetY=${targetY}`);
                            scrollViewRef.current.scrollTo({ y: targetY, animated: true });
                            setDidInitialScroll(true);
                        }
                    }, 500); // Slightly longer timeout for stability
                } else if (Object.keys(checkpointLayouts).length >= totalCheckpoints) {
                     // If all layouts are supposedly registered but the target isn't found, log a warning.
                     // This might happen if layout calculation or state update timing is off.
                    console.warn(`TrackPage: Initial scroll target layout (index ${layoutKey}) not found even though ${Object.keys(checkpointLayouts).length}/${totalCheckpoints} layouts seem registered. Layouts:`, checkpointLayouts);
                     // Consider setting didInitialScroll to true anyway to prevent repeated checks if layout consistently fails
                     // setDidInitialScroll(true);
                }
            } else {
                // All checkpoints are completed, no 'next' one to scroll to.
                console.log("TrackPage: All checkpoints completed, no initial scroll needed.");
                setDidInitialScroll(true); // Mark as done
                // Optionally scroll to the bottom or top
                 setTimeout(() => {
                     if (scrollViewRef.current) {
                         scrollViewRef.current.scrollToEnd({ animated: true });
                     }
                 }, 500);
            }
        }
    }, [track, totalCheckpoints, currentProgress, didInitialScroll, checkpointLayouts]);

    // Reset scroll/layouts when track changes or initial progress changes significantly
    useEffect(() => {
        console.log(`TrackPage: trackId or initialCompletedCheckpoints changed to ${trackId}, ${initialCompletedCheckpoints}. Resetting state.`);
        // Reset flags and layout data for the new track/progress context
        setDidInitialScroll(false);
        setCheckpointLayouts({});
        // Ensure currentProgress reflects the initial value passed in props
        setCurrentProgress(initialCompletedCheckpoints || 0);
         // Scroll to top when track changes
         if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
    }, [trackId, initialCompletedCheckpoints]); // Rerun only when these specific props change


    // --- Render Logic ---

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                     <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading Track...</Text>
                </View>
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            </SafeAreaView>
        );
    }

    if (!track) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                </View>
                <View style={[styles.container, styles.centered]}>
                    <Text style={styles.errorText}>Track not found or could not be loaded.</Text>
                     <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()} // Or implement a retry mechanism
                    >
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // --- Main Track View ---
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{track.title}</Text>
                    {totalCheckpoints > 0 && (
                        <Text style={styles.headerProgress}>{currentProgress} / {totalCheckpoints}</Text>
                    )}
                </View>
                <View style={styles.headerIcons}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="server" size={22} color="#FFD700" />
                        <Text style={styles.iconText}>{coins}</Text>
                    </View>
                    {/* Add other icons if needed */}
                </View>
            </View>

            {/* Track Content */}
            <View style={styles.trackContainer}>
                {totalCheckpoints > 0 ? (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.trackScrollView}
                        contentContainerStyle={[
                            styles.trackContentContainer,
                            // Ensure content height is at least window height for scrolling, but uses estimated if larger
                            { height: Math.max(estimatedContentHeight, windowHeight - (styles.header.height || 60)) } // Adjust for header height
                        ]}
                        showsVerticalScrollIndicator={false}
                        // onScroll={(e) => console.log("Scroll Y:", e.nativeEvent.contentOffset.y)} // Debug scroll position
                        // scrollEventThrottle={16} // Optional: Adjust scroll event frequency
                    >
                        {/* SVG Path */}
                        <View style={styles.svgContainer} pointerEvents="none">
                            {/* Ensure SVG height matches content height */}
                            <Svg height={Math.max(estimatedContentHeight, 1)} width={windowWidth}>
                                {pathPoints.map((point, index) => {
                                    if (index === 0) return null; // No path segment before the first point
                                    const prevPoint = pathPoints[index - 1];

                                    // Basic validation for points
                                    if (!prevPoint || typeof prevPoint.x !== 'number' || typeof prevPoint.y !== 'number' ||
                                        typeof point.x !== 'number' || typeof point.y !== 'number' ||
                                        isNaN(prevPoint.x) || isNaN(prevPoint.y) || isNaN(point.x) || isNaN(point.y)) {
                                        console.warn("Skipping path segment due to invalid points", { prevPoint, point, index });
                                        return null;
                                    }

                                    // Determine segment completion: The segment leads TO the checkpoint at 'point' (index in reversed array)
                                    // The original index of the checkpoint this segment leads TO is:
                                    const segmentEndOriginalIndex = totalCheckpoints - 1 - index;
                                    // The segment is completed if the checkpoint it leads TO is completed
                                    const isSegmentCompleted = segmentEndOriginalIndex < currentProgress;

                                    const pathColor = isSegmentCompleted ? "#3498db" : "#cccccc"; // Blue if completed, gray otherwise
                                    const controlXOffset = 30 * (index % 2 === 0 ? 1 : -1); // Curve offset based on alignment
                                    const controlY = (prevPoint.y + point.y) / 2; // Midpoint Y for curve control

                                    const pathData = `M${prevPoint.x},${prevPoint.y} Q${prevPoint.x + controlXOffset},${controlY} ${point.x},${point.y}`;

                                    return (
                                        <Path
                                            key={`path-${index}`}
                                            d={pathData}
                                            stroke={pathColor}
                                            strokeWidth="5"
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                    );
                                })}
                            </Svg>
                        </View>

                        {/* Checkpoint Cards */}
                        {reversedCheckpoints.map((checkpoint, index) => {
                            const originalIndex = totalCheckpoints - 1 - index;
                            const isCompleted = originalIndex < currentProgress;
                            const isNext = originalIndex === currentProgress;
                            // *** NEW LOGIC: Pressable if completed OR next ***
                            const isPressable = isCompleted || isNext;

                            let checkpointStyle = styles.checkpointLocked;
                            let textStyle = styles.checkpointTextLocked;
                            let iconName = "lock-closed";
                            let iconColor = "#a0a0a0";

                            if (isCompleted) {
                                checkpointStyle = styles.checkpointCompleted;
                                textStyle = styles.checkpointTextCompleted;
                                iconName = "checkmark-circle"; // Checkmark for completed
                                iconColor = "#2ecc71"; // Green for completed
                            } else if (isNext) {
                                checkpointStyle = styles.checkpointNext;
                                textStyle = styles.checkpointTextNext;
                                iconName = "play-circle"; // Play icon for next
                                iconColor = "#ffffff"; // White icon on blue background
                                // Apply specific styles for 'next' directly if needed
                                checkpointStyle = {...checkpointStyle, backgroundColor: '#3498db'};
                                textStyle = {...textStyle, color: '#ffffff', fontWeight: '600'};
                            }
                            // Locked state uses defaults defined above

                            const isAlignedLeft = index % 2 !== 0;
                            const cardContainerStyle = [
                                styles.checkpointCardContainer,
                                { top: index * (CHECKPOINT_HEIGHT_ESTIMATE + CHECKPOINT_VERTICAL_MARGIN) + CHECKPOINT_VERTICAL_MARGIN / 2 },
                                isAlignedLeft ? styles.alignLeft : styles.alignRight,
                            ];

                            return (
                                <View
                                    key={checkpoint.checkpointId}
                                    style={cardContainerStyle}
                                    onLayout={(event) => {
                                        const layout = event.nativeEvent.layout;
                                        const layoutKey = originalIndex; // Use original index as the key
                                         // Update layout only if it's new or significantly changed
                                        if (!checkpointLayouts[layoutKey] || Math.abs((checkpointLayouts[layoutKey]?.y || 0) - layout.y) > 1) {
                                           // console.log(`Layout update for index ${originalIndex} (key ${layoutKey}): y=${layout.y}`);
                                            setCheckpointLayouts((prev) => ({
                                                ...prev,
                                                [layoutKey]: { y: layout.y, height: layout.height },
                                            }));
                                        }
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[styles.checkpointBase, checkpointStyle]}
                                        // *** Pass isPressable to handler ***
                                        onPress={() => handleCheckpointPress(checkpoint, originalIndex, isPressable)}
                                        // *** Disable based on isPressable ***
                                        disabled={!isPressable}
                                        // *** Adjust opacity based on isPressable ***
                                        activeOpacity={isPressable ? 0.7 : 1.0}
                                    >
                                        <Ionicons
                                            name={iconName}
                                            size={24}
                                            color={iconColor}
                                            style={styles.checkpointIcon}
                                        />
                                        <Text
                                            style={[styles.checkpointTextBase, textStyle]}
                                            numberOfLines={2} // Allow slightly more text
                                        >
                                            {/* Use checkpoint title or default */}
                                            {checkpoint.title || `Stage ${originalIndex + 1}`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                ) : (
                    // Message when track has no checkpoints
                    <View style={[styles.container, styles.centered]}>
                        <Text style={styles.infoText}>This track doesn't have any stages yet.</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#FBF7F0" },
    container: { flex: 1, justifyContent: "center", alignItems: "center" }, // Added container style
    notFoundText: { fontSize: 18, color: "#e74c3c", marginLeft: 15 }, // Kept style

    header: {
        borderRadius: 15,
        borderWidth: 3,
        borderColor: '#333333',
        marginLeft: 10,
        marginRight: 10,
        marginTop: 35,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
    },

    backButton: { padding: 5 },

    headerTitleContainer: {
        flexShrink: 1,
        flexGrow: 1,
        alignItems: 'center',
        marginHorizontal: 8
    },

    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
    },
    headerProgress: {
        fontSize: 12,
        color: "#777",
        marginTop: 2,
        textAlign: "center",
    },

    headerIcons: { flexDirection: "row", alignItems: "center" },

    iconContainer: { flexDirection: "row", alignItems: "center", marginLeft: 12 },

    iconText: { marginLeft: 4, fontSize: 14, fontWeight: "500", color: "#444" },
    trackContainer: { flex: 1, backgroundColor: '#FBF7F0' },
    trackScrollView: { flex: 1 },
    trackContentContainer: {
        paddingVertical: CHECKPOINT_VERTICAL_MARGIN / 2, // Adjusted padding
        paddingHorizontal: HORIZONTAL_PADDING,
        position: "relative", // Keep relative for SVG absolute positioning
    },
    svgContainer: {
        position: "absolute",
        top: -CHECKPOINT_VERTICAL_MARGIN/2, // Align with padding
        left: 0, // Span full width for path calculation relative to container
        right: 0,
        bottom: CHECKPOINT_VERTICAL_MARGIN,
        width: "100%", // Span full width
        zIndex: 0, // Path behind cards
    },
    checkpointCardContainer: {
        position: 'absolute', // Use absolute positioning for cards
        width: `${CHECKPOINT_AREA_WIDTH_PERCENT}%`,
        // marginBottom is removed as positioning is absolute
        zIndex: 1, // Cards above path
    },
    // Adjusted alignLeft/Right to use left/right properties with absolute positioning
    alignLeft: { left: HORIZONTAL_PADDING },
    alignRight: { right: HORIZONTAL_PADDING },
    checkpointBase: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        minHeight: CHECKPOINT_HEIGHT_ESTIMATE,
        justifyContent: "flex-start", // Align content left within card
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    checkpointLocked: { borderColor: "#ced4da", backgroundColor: '#f8f9fa' },
    checkpointNext: { borderColor: "#3498db" /* Background added inline */ },
    checkpointCompleted: { borderColor: "#2ecc71", backgroundColor: '#eafaf1' },
    checkpointIcon: { marginRight: 8 },
    checkpointTextBase: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
    checkpointTextLocked: { color: "#adb5bd" },
    checkpointTextNext: { color: "#3498db" /* Color changes inline for blue bg */ },
    checkpointTextCompleted: { color: "#146c43" },
});
// --- End Styles ---

export default TrackPage;
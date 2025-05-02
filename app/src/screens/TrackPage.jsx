// TrackPage.jsx
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
import { loadUserCoins, saveUserProgress, loadUserProgress, getTrackById } from "../utils/storage";

// --- Constants (keep or adjust as needed) ---
const CHECKPOINT_HEIGHT_ESTIMATE = 80;
const CHECKPOINT_VERTICAL_MARGIN = 40;
const HORIZONTAL_PADDING = 20;
const CHECKPOINT_AREA_WIDTH_PERCENT = 45;
const SCROLL_OFFSET = 100;

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

    // --- Load Track Data (useEffect) --- remains the same

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
                    // Add a check for flashcards existence
                    console.log(`TrackPage: Track has ${trackData.flashcards?.length ?? 0} flashcards.`);
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
    const hasFlashcards = track?.flashcards && track.flashcards.length > 0; // Check if flashcards exist

    // --- estimatedContentHeight Calculation --- remains the same
    const estimatedContentHeight =
        reversedCheckpoints.length * (CHECKPOINT_HEIGHT_ESTIMATE + CHECKPOINT_VERTICAL_MARGIN) +
        CHECKPOINT_VERTICAL_MARGIN;

    // --- pathPoints Calculation (useMemo) --- remains the same
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


    // --- saveProgressLocal Function --- remains the same
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


    // --- Focus effect for coins and progress --- remains the same
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
                        if (newProgress !== currentProgress) {
                            console.log(`TrackPage: Progress updated externally for ${trackId} from ${currentProgress} to ${newProgress}`);
                            setCurrentProgress(newProgress);
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


    // --- Effect for handling completed stages --- remains the same
    useEffect(() => {
        // Ensure we have the necessary data and the params are for *this* track
        if (!track || !track.checkpoints || !route.params?.completedStageId || route.params?.trackId !== trackId) {
            return;
        }

        console.log("TrackPage: Completion effect - Checking route.params:", route.params);
        const completedCheckpointId = route.params.completedStageId;

        const completedOriginalIndex = track.checkpoints.findIndex(
            (cp) => cp.checkpointId.toString() === completedCheckpointId.toString()
        );
        console.log(`TrackPage: Completion effect - Original index of completed stage: ${completedOriginalIndex}`);

        if (completedOriginalIndex === -1) {
            console.warn(`TrackPage: Completed checkpoint ID ${completedCheckpointId} not found in track ${trackId}.`);
            navigation.setParams({ completedStageId: null, trackId: null });
            return;
        }

        const expectedCompletedIndex = currentProgress;
        console.log(`TrackPage: Completion effect - Expected index for next completion: ${expectedCompletedIndex}`);

        if (completedOriginalIndex === expectedCompletedIndex) {
            const newProgressCount = currentProgress + 1;
            console.log(`TrackPage: Completion effect - Correct stage completed. Updating progress to: ${newProgressCount}`);
            setCurrentProgress(newProgressCount); // Update UI immediately
            saveProgressLocal(newProgressCount); // Save persistently

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
                }
            }, 400);
        } else {
            console.log(`TrackPage: Completion effect - Completed stage index (${completedOriginalIndex}) does not match expected (${expectedCompletedIndex}). Likely a revisit or out-of-order completion. No progress update.`);
        }

        console.log("TrackPage: Completion effect - Clearing completedStageId/trackId params.");
        navigation.setParams({ completedStageId: null, trackId: null });

    }, [route.params?.completedStageId, route.params?.trackId, trackId, currentProgress, track, checkpointLayouts, navigation, totalCheckpoints]);


    // --- handleCheckpointPress Function --- remains the same
     const handleCheckpointPress = (checkpoint, originalIndex, isPressableFlag) => {
        if (!isPressableFlag) {
            console.log(`TrackPage: Click prevented on locked checkpoint: ${checkpoint.checkpointId} (index ${originalIndex})`);
            return;
        }

        const isRevisit = originalIndex < currentProgress;
        console.log(`TrackPage: Navigating to StagePage for checkpoint ID: ${checkpoint.checkpointId} (index ${originalIndex}) - Revisit: ${isRevisit}`);
        navigation.navigate("StagePage", {
            trackId: trackId,
            checkpoint: checkpoint,
            isRevisit: isRevisit,
        });
    };


    // --- Initial scroll effect --- remains the same
    useEffect(() => {
        if (track && totalCheckpoints > 0 && !didInitialScroll && Object.keys(checkpointLayouts).length >= totalCheckpoints) {
            const nextOriginalIndex = currentProgress;

            if (nextOriginalIndex < totalCheckpoints) {
                const layoutKey = nextOriginalIndex;
                const layout = checkpointLayouts[layoutKey];
                console.log(`TrackPage: Initial scroll check. Target index: ${nextOriginalIndex}, Layout found:`, !!layout);

                if (layout && scrollViewRef.current) {
                    setTimeout(() => {
                        if (scrollViewRef.current) {
                            const targetY = Math.max(0, layout.y - SCROLL_OFFSET);
                            console.log(`TrackPage: Performing initial scroll to y=${layout.y}, targetY=${targetY}`);
                            scrollViewRef.current.scrollTo({ y: targetY, animated: true });
                            setDidInitialScroll(true);
                        }
                    }, 500);
                } else if (Object.keys(checkpointLayouts).length >= totalCheckpoints) {
                    console.warn(`TrackPage: Initial scroll target layout (index ${layoutKey}) not found even though ${Object.keys(checkpointLayouts).length}/${totalCheckpoints} layouts seem registered. Layouts:`, checkpointLayouts);
                }
            } else {
                console.log("TrackPage: All checkpoints completed, no initial scroll needed.");
                setDidInitialScroll(true);
                setTimeout(() => {
                    if (scrollViewRef.current) {
                        scrollViewRef.current.scrollToEnd({ animated: true });
                    }
                }, 500);
            }
        }
    }, [track, totalCheckpoints, currentProgress, didInitialScroll, checkpointLayouts]);


    // --- Reset scroll/layouts effect --- remains the same
    useEffect(() => {
        console.log(`TrackPage: trackId or initialCompletedCheckpoints changed to ${trackId}, ${initialCompletedCheckpoints}. Resetting state.`);
        setDidInitialScroll(false);
        setCheckpointLayouts({});
        setCurrentProgress(initialCompletedCheckpoints || 0);
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
    }, [trackId, initialCompletedCheckpoints]);


    // --- NEW: Flashcard Navigation Handler ---
    const handleFlashcardPress = () => {
        if (!trackId || !hasFlashcards) {
             Alert.alert("No Flashcards", "Flashcards are not available for this track yet.");
             return;
        }
        console.log(`TrackPage: Navigating to FlashcardPage for trackId: ${trackId}`);
        navigation.navigate('FlashcardPage', { trackId: trackId });
    };
    // --- END NEW ---


    // --- Render Logic ---

    if (isLoading) {
        // --- Loading State --- remains the same
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading Track...</Text>
                     {/* Placeholder for icons area */}
                    <View style={{ width: 60 }} />
                </View>
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            </SafeAreaView>
        );
    }

    if (!track) {
        // --- Error State / Track Not Found --- remains the same
        return (
             <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                     {/* Placeholder for icons area */}
                    <View style={{ width: 60 }} />
                </View>
                <View style={[styles.container, styles.centered]}>
                    <Text style={styles.errorText}>Track not found or could not be loaded.</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
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
            {/* Header - MODIFIED */}
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
                {/* Icons container */}
                <View style={styles.headerIcons}>
                     {/* Flashcard Button - Only show if flashcards exist */}

                    {/* Coin Display */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="server" size={22} color="#ffdd00" />
                        <Text style={styles.iconText}>{coins}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.flashcardContainer}>
            {hasFlashcards && (
                         <TouchableOpacity onPress={handleFlashcardPress} >
                            <Ionicons name="layers-outline" size={26} color="#3498db" />
                        </TouchableOpacity>
                    )}
            </View>
            {/* Track Content */}
            {/* ScrollView, SVG Path, Checkpoint Cards - NO CHANGES needed here */}
            <View style={styles.trackContainer}>
                {totalCheckpoints > 0 ? (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.trackScrollView}
                        contentContainerStyle={[
                            styles.trackContentContainer,
                            { height: Math.max(estimatedContentHeight, windowHeight - 60) } // Adjust approx header height
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* SVG Path */}
                        <View style={styles.svgContainer} pointerEvents="none">
                            <Svg height={Math.max(estimatedContentHeight, 1)} width={windowWidth}>
                                {pathPoints.map((point, index) => {
                                    if (index === 0) return null;
                                    const prevPoint = pathPoints[index - 1];
                                    if (!prevPoint || typeof prevPoint.x !== 'number' || typeof prevPoint.y !== 'number' ||
                                        typeof point.x !== 'number' || typeof point.y !== 'number' ||
                                        isNaN(prevPoint.x) || isNaN(prevPoint.y) || isNaN(point.x) || isNaN(point.y)) {
                                        console.warn("Skipping path segment due to invalid points", { prevPoint, point, index });
                                        return null;
                                    }
                                    const segmentEndOriginalIndex = totalCheckpoints - 1 - index;
                                    const isSegmentCompleted = segmentEndOriginalIndex < currentProgress;
                                    const pathColor = isSegmentCompleted ? "#3498db" : "#cccccc";
                                    const controlXOffset = 30 * (index % 2 === 0 ? 1 : -1);
                                    const controlY = (prevPoint.y + point.y) / 2;
                                    const pathData = `M${prevPoint.x},${prevPoint.y} Q${prevPoint.x + controlXOffset},${controlY} ${point.x},${point.y}`;
                                    return ( <Path key={`path-${index}`} d={pathData} stroke={pathColor} strokeWidth="5" fill="none" strokeLinecap="round" /> );
                                })}
                            </Svg>
                        </View>

                        {/* Checkpoint Cards */}
                        {reversedCheckpoints.map((checkpoint, index) => {
                            const originalIndex = totalCheckpoints - 1 - index;
                            const isCompleted = originalIndex < currentProgress;
                            const isNext = originalIndex === currentProgress;
                            const isPressable = isCompleted || isNext;

                            let checkpointStyle = styles.checkpointLocked;
                            let textStyle = styles.checkpointTextLocked;
                            let iconName = "lock-closed";
                            let iconColor = "#a0a0a0";

                            if (isCompleted) {
                                checkpointStyle = styles.checkpointCompleted;
                                textStyle = styles.checkpointTextCompleted;
                                iconName = "checkmark-circle";
                                iconColor = "#2ecc71";
                            } else if (isNext) {
                                checkpointStyle = styles.checkpointNext;
                                textStyle = styles.checkpointTextNext;
                                iconName = "play-circle";
                                iconColor = "#ffffff";
                                checkpointStyle = {...checkpointStyle, backgroundColor: '#3498db'};
                                textStyle = {...textStyle, color: '#ffffff', fontWeight: '600'};
                            }

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
                                        const layoutKey = originalIndex;
                                        if (!checkpointLayouts[layoutKey] || Math.abs((checkpointLayouts[layoutKey]?.y || 0) - layout.y) > 1) {
                                            setCheckpointLayouts((prev) => ({ ...prev, [layoutKey]: { y: layout.y, height: layout.height } }));
                                        }
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[styles.checkpointBase, checkpointStyle]}
                                        onPress={() => handleCheckpointPress(checkpoint, originalIndex, isPressable)}
                                        disabled={!isPressable}
                                        activeOpacity={isPressable ? 0.7 : 1.0}
                                    >
                                        <Ionicons name={iconName} size={24} color={iconColor} style={styles.checkpointIcon} />
                                        <Text style={[styles.checkpointTextBase, textStyle]} numberOfLines={2} >
                                            {checkpoint.title || `Stage ${originalIndex + 1}`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={[styles.container, styles.centered]}>
                        <Text style={styles.infoText}>This track doesn't have any stages yet.</Text>
                    </View>
                )}
            </View>

        </SafeAreaView>
    );
};

// --- Styles --- (Add/Modify styles for header icons)
const styles = StyleSheet.create({
    flashcardContainer: {
        position: "absolute",
        top: 110,
        left: 10,
        zIndex: 1,
        borderColor: '#4a4a4a',
        borderWidth: 0,
        backgroundColor: "#eeeeee",
        borderRadius: 10,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.4,
    },
    safeArea: { flex: 1, backgroundColor: "#ffffff" },
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    centered: { // Added for centering loading/error/empty states
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: { // Style for error messages
        fontSize: 16,
        color: '#c0392b',
        textAlign: 'center',
        marginBottom: 15,
    },
    retryButton: { // Style for retry/go back buttons
         backgroundColor: '#3498db',
         paddingVertical: 10,
         paddingHorizontal: 20,
         borderRadius: 5,
    },
    retryButtonText: {
         color: '#ffffff',
         fontSize: 16,
         fontWeight: '500',
    },
    infoText: { // Style for informational text like "no stages"
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    notFoundText: { fontSize: 18, color: "#e74c3c", marginLeft: 15 },

    header: {
        // borderRadius: 15,
        // borderWidth: 3,
        // borderColor: '#333333',
        // marginLeft: 10,
        // marginRight: 10,
        // marginTop: 35,
        padding: 10,
        borderBottomWidth: 1,
        backgroundColor: '#ededed',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Space items out
        minHeight: 100, // Ensure minimum header height
    },

    backButton: { padding: 5, marginTop:20 }, // Keep padding for touch area

    headerTitleContainer: {
        marginTop:30,
        flex: 1, // Allow title container to take up space
        alignItems: 'center',
        marginHorizontal: 0, // Add some horizontal margin
    },

    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#33333",
        textAlign: "center",
    },
    headerProgress: {
        fontSize: 12,
        color: "#777",
        marginTop: 2,
        textAlign: "center",
    },

    // Container for all icons on the right
    headerIcons: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'flex-end', // Align icons to the right
        minWidth: 60, // Ensure space for icons even if title is long
    },

    // Style for individual icon buttons like flashcards
    iconButton: {
         padding: 5, // Touch area
         marginLeft: 10, // Space from previous item (or edge)
    },

    // Style for icon+text pairs like coins
    iconContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10, // Space from flashcard button or edge
        marginRight: 10, // Space from edge
        padding: 5, // Touch area
        borderRadius: 0,
        marginTop: 30,
    },

    iconText: { marginLeft: 4, fontSize: 14, fontWeight: "500", color: "#444" },

    // --- Rest of the styles remain the same ---
    trackContainer: { flex: 1, backgroundColor: '#ffffff' },
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
        zIndex: 1, // Cards above path
    },
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
    checkpointTextNext: { color: "#ffffff" /* Color changes inline for blue bg */ }, // Adjusted color for blue background
    checkpointTextCompleted: { color: "#146c43" },
});
// --- End Styles ---

export default TrackPage;
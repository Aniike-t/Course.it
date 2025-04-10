import React, { useState, useEffect, useRef } from "react";
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

const CHECKPOINT_AREA_WIDTH_PERCENT = 60;
const CHECKPOINT_VERTICAL_MARGIN = 70;
const CHECKPOINT_HEIGHT_ESTIMATE = 55;
const HORIZONTAL_PADDING = 20;
const SCROLL_OFFSET = 50;

const TrackPage = ({ route, navigation }) => {
    const { trackId, completedCheckpoints: initialCompletedCheckpoints } = route.params || {};
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [checkpointLayouts, setCheckpointLayouts] = useState({});
    const [didInitialScroll, setDidInitialScroll] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(initialCompletedCheckpoints || 0);
    const [coins, setCoins] = useState(0);
    const scrollViewRef = useRef(null);
    
    // Add track state and loading state
    const [track, setTrack] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load track data using getTrackById
    useEffect(() => {
        async function loadTrackData() {
            if (!trackId) {
                setIsLoading(false);
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
                }
            } catch (error) {
                console.error(`TrackPage: Error loading track ${trackId}:`, error);
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
        CHECKPOINT_VERTICAL_MARGIN;

    // Calculate path points
    const pathPoints = React.useMemo(() => {
        const points = [];
        const checkpointAreaWidth = windowWidth * (CHECKPOINT_AREA_WIDTH_PERCENT / 100);
        const availableSpace = windowWidth - 2 * HORIZONTAL_PADDING;

        reversedCheckpoints.forEach((checkpoint, index) => {
            const y =
                index * (CHECKPOINT_HEIGHT_ESTIMATE + CHECKPOINT_VERTICAL_MARGIN) +
                CHECKPOINT_HEIGHT_ESTIMATE / 2 +
                CHECKPOINT_VERTICAL_MARGIN;
            const isAlignedLeft = index % 2 !== 0;
            let x;
            if (isAlignedLeft) {
                x = HORIZONTAL_PADDING + checkpointAreaWidth / 2;
            } else {
                x = HORIZONTAL_PADDING + availableSpace - checkpointAreaWidth / 2;
            }
            // Ensure x, y are numbers
            if (typeof x === 'number' && typeof y === 'number') {
                points.push({ x, y });
            } else {
                console.warn("Invalid coordinates generated for path point", {x, y, index});
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
                try {
                    const loadedCoins = await loadUserCoins();
                    const progress = await loadUserProgress();
                    if (isActive) {
                        setCoins(loadedCoins);
                        const newProgress = progress[trackId] || 0;
                        if (newProgress !== currentProgress) {
                            console.log(`TrackPage: Progress updated externally for ${trackId} to ${newProgress}`);
                            setCurrentProgress(newProgress);
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
        }, [trackId, currentProgress])
    );

    // Effect for handling completed stages
    useEffect(() => {
        if (!track || !track.checkpoints || !route.params?.completedStageId || route.params?.trackId !== trackId) {
            return;
        }

        console.log("TrackPage: Completion effect - Checking route.params:", route.params);
        const completedCheckpointId = route.params.completedStageId;

        // Find the original index (0-based) of the completed checkpoint
        const completedOriginalIndex = track.checkpoints.findIndex(
            (cp) => cp.checkpointId.toString() === completedCheckpointId.toString()
        );
        console.log(`TrackPage: Completion effect - Original index of completed stage: ${completedOriginalIndex}`);

        if (completedOriginalIndex === -1) {
            console.warn(`TrackPage: Completed checkpoint ID ${completedCheckpointId} not found in track ${trackId}.`);
            navigation.setParams({ completedStageId: null, trackId: null });
            return;
        }

        // Check if this is the *next* expected stage
        const expectedCompletedIndex = currentProgress;
        console.log(`TrackPage: Completion effect - Expected index for next completion: ${expectedCompletedIndex}`);

        if (completedOriginalIndex === expectedCompletedIndex) {
            const newProgressCount = currentProgress + 1;
            console.log(`TrackPage: Completion effect - Correct stage completed. Updating progress to: ${newProgressCount}`);
            setCurrentProgress(newProgressCount); // Update UI immediately
            saveProgressLocal(newProgressCount); // Save persistently

            // Scroll to the *new* next checkpoint
            setTimeout(() => {
                const nextOriginalIndex = newProgressCount;
                const layoutKey = nextOriginalIndex;

                console.log(`TrackPage: Scrolling check after completion. nextOriginalIndex: ${nextOriginalIndex}`);

                const nextLayout = checkpointLayouts[layoutKey];
                if (nextLayout && scrollViewRef.current) {
                    const targetY = Math.max(0, nextLayout.y - SCROLL_OFFSET);
                    console.log(`TrackPage: Scrolling to next checkpoint layout at y=${nextLayout.y}, targetY=${targetY}`);
                    scrollViewRef.current.scrollTo({ y: targetY, animated: true });
                } else {
                    console.log("TrackPage: Next checkpoint layout not found or scrollRef not ready for scroll after completion.");
                }
            }, 300);
        } else {
            console.log(`TrackPage: Completion effect - Completed stage index (${completedOriginalIndex}) does not match expected (${expectedCompletedIndex}). No progress update.`);
        }

        // Clean up the parameter to avoid re-triggering
        console.log("TrackPage: Completion effect - Clearing completedStageId/trackId params.");
        navigation.setParams({ completedStageId: null, trackId: null });

    }, [route.params?.completedStageId, route.params?.trackId, trackId, currentProgress, track, checkpointLayouts, navigation]);

    // Checkpoint press handler
    const handleCheckpointPress = (checkpoint, originalIndex) => {
        // Logic from the provided code: only the 'next' stage is pressable
        const isNext = originalIndex === currentProgress;
        if (!isNext) {
            console.log(`TrackPage: Click prevented on non-next checkpoint: ${checkpoint.checkpointId} (index ${originalIndex})`);
            return;
        }

        console.log(`TrackPage: Navigating to StagePage for checkpoint ID: ${checkpoint.checkpointId} (index ${originalIndex})`);
        navigation.navigate("StagePage", {
            trackId: trackId,
            checkpoint: checkpoint,
        });
    };

    // Initial scroll to next checkpoint
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
                    }, 400);
                } else {
                    if (Object.keys(checkpointLayouts).length >= totalCheckpoints) {
                        console.warn(`TrackPage: Initial scroll target layout (index ${layoutKey}) not found even though all layouts seem registered.`);
                    }
                }
            } else {
                console.log("TrackPage: All checkpoints completed, no initial scroll needed.");
                setDidInitialScroll(true);
            }
        }
    }, [track, totalCheckpoints, currentProgress, didInitialScroll, checkpointLayouts]);

    // Reset scroll/layouts when track changes
    useEffect(() => {
        console.log(`TrackPage: trackId or initialCompletedCheckpoints changed to ${trackId}, ${initialCompletedCheckpoints}. Resetting scroll/layouts.`);
        setDidInitialScroll(false);
        setCheckpointLayouts({});
        setCurrentProgress(initialCompletedCheckpoints || 0);
    }, [trackId, initialCompletedCheckpoints]);

    // Show loading indicator while track is being fetched
    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading...</Text>
                </View>
                <View style={[styles.container, styles.centered]}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            </SafeAreaView>
        );
    }

    // Show not found message if track couldn't be loaded
    if (!track) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.notFoundText}>Track not found!</Text>
                </View>
                <View style={styles.container}>
                    <Text style={styles.errorText}>
                        The track you're looking for couldn't be found. It may have been deleted or there was an error loading it.
                    </Text>
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {track.title}
                    </Text>
                    {totalCheckpoints > 0 && (
                        <Text style={styles.headerProgress}>
                            {currentProgress} / {totalCheckpoints}
                        </Text>
                    )}
                </View>

                <View style={styles.headerIcons}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="server" size={22} color="#FFD700" />
                        <Text style={styles.iconText}>{coins}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.trackContainer}>
                {totalCheckpoints > 0 ? (
                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.trackScrollView}
                        contentContainerStyle={[
                            styles.trackContentContainer,
                            { height: Math.max(estimatedContentHeight, windowHeight) },
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.svgContainer} pointerEvents="none">
                            <Svg height={Math.max(estimatedContentHeight, 1)} width={Math.max(windowWidth, 1)}>
                                {pathPoints.map((point, index) => {
                                    if (index === 0) return null;
                                    const prevPoint = pathPoints[index - 1];
                                    if (!prevPoint || typeof prevPoint.x !== 'number' || typeof prevPoint.y !== 'number' ||
                                        typeof point.x !== 'number' || typeof point.y !== 'number') {
                                        console.warn("Skipping path segment due to invalid points", {prevPoint, point, index});
                                        return null;
                                    }

                                    // Logic for segment completion based on the *end* point (checkpoint it leads TO)
                                    const segmentEndOriginalIndex = totalCheckpoints - 1 - index;
                                    // A segment is completed if the checkpoint it *leads to* is completed
                                    const isSegmentCompleted = segmentEndOriginalIndex < currentProgress;

                                    const pathColor = isSegmentCompleted ? "#3498db" : "#cccccc";
                                    const controlXOffset = 20 * (index % 2 === 0 ? 1 : -1); // Offset for curve
                                    const controlY = (prevPoint.y + point.y) / 2; // Midpoint Y for control

                                    // Ensure path data uses valid numbers
                                    const pathData = `M${prevPoint.x},${prevPoint.y} Q${
                                        prevPoint.x + controlXOffset
                                    },${controlY} ${point.x},${point.y}`;

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
                        {reversedCheckpoints.map((checkpoint, index) => {
                            const originalIndex = totalCheckpoints - 1 - index;
                            const isCompleted = originalIndex < currentProgress;
                            const isNext = originalIndex === currentProgress;
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
                                        if (!checkpointLayouts[layoutKey] || Math.abs(checkpointLayouts[layoutKey].y - layout.y) > 1) {
                                            setCheckpointLayouts((prev) => ({
                                                ...prev,
                                                [layoutKey]: { y: layout.y, height: layout.height },
                                            }));
                                        }
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[styles.checkpointBase, checkpointStyle]}
                                        onPress={() => handleCheckpointPress(checkpoint, originalIndex)}
                                        disabled={!isNext}
                                        activeOpacity={isNext ? 0.7 : 1.0}
                                    >
                                        <Ionicons
                                            name={iconName}
                                            size={24}
                                            color={iconColor}
                                            style={styles.checkpointIcon}
                                        />
                                        <Text
                                            style={[styles.checkpointTextBase, textStyle]}
                                            numberOfLines={1}
                                        >
                                            {checkpoint.title ? checkpoint.title : `Stage ${checkpoint.checkpointId}`}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                ) : (
                    <View style={styles.container}>
                        <Text style={{color: '#666', fontSize: 16}}>This track doesn't have any stages defined yet.</Text>
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
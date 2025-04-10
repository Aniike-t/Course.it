// StagePage.jsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { addUserCoins, updateTrackProgress, loadUserProgress } from '../utils/storage';

const StagePage = ({ route, navigation }) => {
    const {
        trackId = 'unknown',
        checkpoint = {
            checkpointId: 'N/A',
            title: 'Unknown Stage',
            description: 'No description available.',
            creatorName: 'Unknown Creator',
            outcomes: [],
            videoUrl: null
        },
    } = route.params || {};

    const [isCompleting, setIsCompleting] = useState(false);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false); // NEW State

    useEffect(() => {
        const checkCompletionStatus = async () => {
            try {
                const userProgress = await loadUserProgress();
                const progress = userProgress[trackId] || 0;
                setIsAlreadyCompleted(progress >= checkpoint.checkpointId); // Check if *this* stage is completed
                console.log(`StagePage - Stage ${checkpoint.checkpointId} completion status: ${isAlreadyCompleted}`);
            } catch (error) {
                console.error("StagePage - Error loading user progress:", error);
            }
        };

        checkCompletionStatus();
    }, [trackId, checkpoint.checkpointId]);

    const handleCompletePress = async () => {
        if (isCompleting) {
            console.log("StagePage - Complete button pressed while already completing. Ignoring.");
            return;
        }

        console.log(`StagePage - Stage ${checkpoint.checkpointId} completion initiated.`);
        setIsCompleting(true); // Set isCompleting to true *immediately*
        setShowCoinAnimation(false);

        try {
            // Add coins
            await addUserCoins(5);

            // NEW: Update track progress - This is the key addition
            await updateTrackProgress(trackId, checkpoint.checkpointId);

            setShowCoinAnimation(true);

            setTimeout(() => {
                setShowCoinAnimation(false);
                console.log(`StagePage - Setting params and navigating back for completion of ${checkpoint.checkpointId}`);

                // Set params before navigating back
                navigation.setParams({
                    completedStageId: checkpoint.checkpointId,
                    trackId: trackId
                });

                navigation.goBack(); // Use goBack

            }, 1500);

        } catch (error) {
            console.error("StagePage - Error during completion process:", error);
            Alert.alert("Error", "Something went wrong marking stage as complete.");
            setIsCompleting(false); // Reset isCompleting on error
        }
    };

    const getVideoId = (url) => {
        if (!url) return null;
        const regex = /(?:\?v=|\/embed\/|\.be\/|youtu\.be\/)([\w-]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };
    const videoId = getVideoId(checkpoint.videoUrl);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    disabled={isCompleting}
                >
                    <Ionicons name="arrow-back" size={28} color={isCompleting ? "#ccc" : "#444"} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    Stage {checkpoint.checkpointId}
                </Text>
                <View style={{ width: 38 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.stageTitle}>{checkpoint.title}</Text>

                {checkpoint.creatorName && (
                    <Text style={styles.creatorText}>by {checkpoint.creatorName}</Text>
                )}

                {videoId ? (
                    <View style={styles.videoContainer}>
                        <YoutubePlayer
                            height={220}
                            play={false}
                            videoId={videoId}
                            webViewStyle={{ opacity: 0.99 }}
                        />
                    </View>
                ) : (
                    <View style={styles.videoPlaceholder}>
                        <Ionicons name="play-circle-outline" size={60} color="#cccccc" />
                        <Text style={styles.videoPlaceholderText}>(Video Not Available)</Text>
                    </View>
                )}

                {checkpoint.description && (
                    <Text style={styles.descriptionText}>{checkpoint.description}</Text>
                )}

                {checkpoint.outcomes && checkpoint.outcomes.length > 0 && (
                    <View style={styles.outcomesContainer}>
                        <Text style={styles.outcomesTitle}>Learning Outcomes:</Text>
                        {checkpoint.outcomes.map((outcome, index) => (
                            <View key={index} style={styles.outcomeItemContainer}>
                                <Text style={styles.outcomeBullet}>{'\u2022'}</Text>
                                <Text style={styles.outcomeText}>{outcome}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
                <TouchableOpacity
                    style={[styles.completeButton, (isCompleting || isAlreadyCompleted) && styles.completeButtonDisabled]}
                    onPress={handleCompletePress}
                    disabled={isCompleting || isAlreadyCompleted} // Disable if already completed
                >
                    {isCompleting && !showCoinAnimation ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.completeButtonText}>
                            {isAlreadyCompleted ? 'Already Completed' : 'Mark Stage as Complete'}
                        </Text>
                    )}
                </TouchableOpacity>
                <View style={{ height: 20 }} />
            </ScrollView>

            {showCoinAnimation && (
                <View style={styles.coinAnimationContainer}>
                    <Text style={styles.coinAnimationText}>+5 🪙</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBF7F0',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30,
        alignItems: 'center',
    },
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
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3C3633',
        flexShrink: 1,
        textAlign: 'center',
    },
    stageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#3C3633',
        marginTop: 25,
        marginBottom: 8,
        textAlign: 'center',
    },
    creatorText: {
        fontSize: 14,
        color: '#777',
        marginBottom: 25,
    },
    videoContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
    },
    videoPlaceholder: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#EFEAE4',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EAE0D5',
    },
    videoPlaceholderText: {
        marginTop: 5,
        fontSize: 14,
        color: '#a0a0a0',
    },
    descriptionText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'left',
        lineHeight: 23,
        marginBottom: 25,
        width: '100%',
    },
    outcomesContainer: {
        width: '100%',
        padding: 15,
        backgroundColor: '#EFEAE4',
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#EAE0D5',
    },
    outcomesTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#3C3633',
        marginBottom: 12,
    },
    outcomeItemContainer: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'flex-start',
    },
    outcomeBullet: {
        fontSize: 16,
        color: '#3C3633',
        marginRight: 8,
        lineHeight: 22,
    },
    outcomeText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 22,
        flex: 1,
    },
    completeButton: {
        backgroundColor: '#5E8B7E',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    completeButtonDisabled: {
        backgroundColor: '#a9c7bf',
    },
    completeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    coinAnimationContainer: {
        position: 'absolute',
        bottom: 80,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        zIndex: 100,
    },
    coinAnimationText: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
    }
});

export default StagePage;
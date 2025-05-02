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
    TextInput, // Import TextInput
    KeyboardAvoidingView, // Import KeyboardAvoidingView
    Platform, // Import Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { addUserCoins, updateTrackProgress, loadUserProgress } from '../utils/storage'; // Keep these
import { styles } from './styles/StagePageStyles'; // Import styles from the new file

// --- NEW API URL (adjust if your backend runs elsewhere) ---
// Replace with your actual backend URL if deployed, otherwise use localhost for local testing
const API_BASE_URL ='https://courseitbackend.vercel.app';
// const API_BASE_URL = 'http://localhost:5000'; 

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

    // --- State Variables ---
    const [isCompleting, setIsCompleting] = useState(false); // Keep for general loading state if needed (e.g., initial load)
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [coinAmountAnimated, setCoinAmountAnimated] = useState(0);
    const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);

    // --- NEW Assessment State ---
    const [userAnswer, setUserAnswer] = useState('');
    const [isAssessing, setIsAssessing] = useState(false); // Specific state for assessment API call
    const [assessmentFeedback, setAssessmentFeedback] = useState(null);
    const [assessmentScore, setAssessmentScore] = useState(null);
    const [assessmentStatus, setAssessmentStatus] = useState(null); // 'passed', 'failed', or null

    // --- Constants ---
    const PASSING_SCORE = 5;
    // Generate the question using the checkpoint title
    const assessmentQuestion = `Based on the content (title, description, outcomes) of this stage ("${checkpoint.title}"), briefly explain what you learned or a key takeaway.`;

    // --- useEffect to check initial completion status ---
    useEffect(() => {
        const checkCompletionStatus = async () => {
            // Reset assessment state when component loads or checkpoint changes
            setUserAnswer('');
            setAssessmentFeedback(null);
            setAssessmentScore(null);
            setAssessmentStatus(null);
            setIsAssessing(false);
            setShowCoinAnimation(false); // Ensure animation isn't stuck

            try {
                const userProgress = await loadUserProgress();
                // Ensure checkpointId is treated consistently (e.g., as number) for comparison
                const progress = userProgress[trackId] || 0;
                const currentCheckpointId = Number(checkpoint.checkpointId); // Convert to number for safety
                const completed = progress >= currentCheckpointId;
                setIsAlreadyCompleted(completed);
                console.log(`StagePage - Stage ${currentCheckpointId} initial completion status: ${completed} (Progress: ${progress})`);
            } catch (error) {
                console.error("StagePage - Error loading user progress:", error);
                // Handle error, maybe show a message or default to not completed
                setIsAlreadyCompleted(false);
            }
        };

        checkCompletionStatus();
    }, [trackId, checkpoint.checkpointId]); // Rerun if track or checkpoint changes

    // --- Helper Function: Get Video ID ---
    const getVideoId = (url) => {
        if (!url) return null;
        // Regex to capture video ID from various YouTube URL formats
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
        const match = url.match(regex);
        if (match && match[1]) {
            console.log("getVideoId - Extracted videoId:", match[1]);
            return match[1];
        }
        console.warn("getVideoId - Could not extract videoId from URL:", url);
        return null; // Return null if no match
    };
    const videoId = getVideoId(checkpoint.videoUrl);


    // --- Handle Assessment Submission ---
    const handleSubmitAnswer = async () => {
        // Prevent submission if already assessing, or if the stage is somehow marked completed during the process, or if answer is empty
        if (isAssessing || isAlreadyCompleted || !userAnswer.trim()) {
            if (!userAnswer.trim()) Alert.alert("Input Required", "Please enter your answer.");
            return;
        }

        console.log(`StagePage - Submitting answer for assessment: Stage ${checkpoint.checkpointId}`);
        setIsAssessing(true);
        setAssessmentFeedback(null); // Clear previous feedback
        setAssessmentScore(null);
        setAssessmentStatus(null);

        try {
            // Construct the request body
            const requestBody = {
                trackId: trackId,
                checkpointId: checkpoint.checkpointId.toString(), // Ensure consistent type (string) if needed
                userAnswer: userAnswer,
            };
            console.log("Sending to /assess_answer:", JSON.stringify(requestBody)); // Log payload

            const response = await fetch(`${API_BASE_URL}/assess_answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            // Log raw response for debugging
            const responseText = await response.text();
            console.log("Raw assessment response:", responseText);

            let result;
            try {
                 result = JSON.parse(responseText); // Try parsing the logged text
            } catch (parseError) {
                 console.error("Failed to parse assessment response JSON:", parseError);
                 throw new Error("Received invalid data from the assessment server.");
            }


            if (!response.ok) {
                // Handle API errors (like 4xx, 5xx) using the parsed message if available
                console.error("Assessment API Error Response:", result);
                throw new Error(result.message || `Assessment request failed with status: ${response.status}`);
            }

            console.log("Parsed Assessment Result:", result);
            // Safely access score and feedback
            const score = result.score;
            const feedback = result.feedback;

             // Validate score type and range
            if (typeof score !== 'number' || score < 0 || score > 10) {
                console.error("Invalid score received:", score);
                throw new Error("Received an invalid score from the assessment.");
            }

            setAssessmentScore(score);
            setAssessmentFeedback(feedback || "No specific feedback provided."); // Provide default feedback if null/empty

            // --- Handle Passing ---
            if (score >= PASSING_SCORE) {
                setAssessmentStatus('passed');
                console.log(`StagePage - Assessment PASSED with score: ${score}`);

                // Award coins & update progress
                // Use try-catch for these critical updates as well
                try {
                    await addUserCoins(score); // Award score amount
                    await updateTrackProgress(trackId, checkpoint.checkpointId);
                    console.log(`Progress updated for track ${trackId} to ${checkpoint.checkpointId}`);
                } catch (updateError) {
                     console.error("Error updating progress/coins after passing:", updateError);
                     // Decide how to handle this - maybe alert user? For now, log it.
                     // Assessment UI will still show passed, but backend state might be inconsistent.
                }


                // Trigger animation and navigate back
                setCoinAmountAnimated(score); // Set amount for animation text
                setShowCoinAnimation(true);
                setIsAlreadyCompleted(true); // Update UI immediately to reflect completion

                // Delay navigation slightly longer
                setTimeout(() => {
                    setShowCoinAnimation(false);
                    console.log(`StagePage - Navigating back after passing assessment for ${checkpoint.checkpointId}`);
                    navigation.setParams({ // Send completion info back to TrackPage
                        completedStageId: checkpoint.checkpointId,
                        trackId: trackId
                    });
                    navigation.goBack();
                }, 2000); // Extended timeout

            // --- Handle Failing ---
            } else {
                setAssessmentStatus('failed');
                console.log(`StagePage - Assessment FAILED with score: ${score}`);
                // Keep the user's answer in the input field to allow editing
                Alert.alert("Try Again", `Your score: ${score}/10. ${feedback || 'Please review the stage content and refine your answer.'}`);
            }

        } catch (error) {
            console.error("StagePage - Error during assessment submission process:", error);
            // Provide more specific error message to user if possible
            Alert.alert("Assessment Error", `Could not assess answer: ${error.message}`);
            setAssessmentFeedback("An error occurred during assessment. Please check your connection and try again."); // Show generic feedback on error
            setAssessmentStatus('failed'); // Treat error as failure for UI flow
        } finally {
            setIsAssessing(false); // Stop loading indicator
        }
    };


    // --- Render Logic ---
    return (
        <SafeAreaView style={styles.safeArea}>
             <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                // Adjust offset based on your header height or other elements
                keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 90}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        // Disable back button while assessing or during the success animation/delay
                        disabled={isAssessing || (showCoinAnimation && assessmentStatus === 'passed')}
                    >
                        <Ionicons name="arrow-back" size={28} color={(isAssessing || (showCoinAnimation && assessmentStatus === 'passed')) ? "#ccc" : "#444"} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Stage {checkpoint.checkpointId}
                    </Text>
                    {/* Spacer for centering title */}
                    <View style={{ width: 38 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled" // Helps with tapping buttons while keyboard is up
                >
                    {/* --- Stage Content --- */}
                    <Text style={styles.stageTitle}>{checkpoint.title}</Text>
                    {checkpoint.creatorName && <Text style={styles.creatorText}>by {checkpoint.creatorName}</Text>}
                    {videoId ? (
                        <View style={styles.videoContainer}>
                            <YoutubePlayer
                                height={220}
                                play={false} // Autoplay off
                                videoId={videoId}
                                webViewStyle={{ opacity: 0.99 }} // Required for some RN versions
                                // Optional: Add error handling for the player
                                // onError={(e) => console.error('Youtube Player Error:', e)}
                            />
                        </View>
                    ) : (
                        <View style={styles.videoPlaceholder}>
                            <Ionicons name="play-circle-outline" size={60} color="#cccccc" />
                            <Text style={styles.videoPlaceholderText}>(Video Not Available)</Text>
                        </View>
                    )}
                    {checkpoint.description && <Text style={styles.descriptionText}>{checkpoint.description}</Text>}
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

                    {/* --- Assessment Section (Conditional Rendering) --- */}
                    {!isAlreadyCompleted ? (
                        <View style={styles.assessmentSection}>
                            <Text style={styles.assessmentTitle}>Test Your Knowledge</Text>
                            <Text style={styles.assessmentQuestion}>{assessmentQuestion}</Text>

                            <TextInput
                                style={styles.answerInput}
                                placeholder="Type your answer here..."
                                value={userAnswer}
                                onChangeText={setUserAnswer}
                                multiline
                                // Disable input while assessment is in progress
                                editable={!isAssessing}
                                placeholderTextColor="#999"
                                // Optional: Increase height based on content, up to a max
                                // numberOfLines={4} // Suggest initial height
                            />

                            {/* Display Feedback and Score (conditionally) */}
                            {assessmentFeedback && (
                                <View style={[
                                    styles.feedbackContainer,
                                    // Apply dynamic styling based on pass/fail status
                                    assessmentStatus === 'passed' ? styles.feedbackPassed : (assessmentStatus === 'failed' ? styles.feedbackFailed : styles.feedbackNeutral)
                                ]}>
                                    <Text style={styles.feedbackTitle}>Feedback:</Text>
                                    <Text style={styles.feedbackText}>{assessmentFeedback}</Text>
                                    {/* Only show score if it's a number */}
                                    {typeof assessmentScore === 'number' && (
                                        <Text style={styles.scoreText}>
                                            Score: {assessmentScore} / 10
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Submit Button */}
                             <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    // Disable appearance if assessing or answer is empty
                                    (isAssessing || !userAnswer.trim()) && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmitAnswer}
                                disabled={isAssessing || !userAnswer.trim()} // Actual disable flag
                            >
                                {isAssessing ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Answer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                         // --- Show Completed State ---
                         <View style={styles.completedContainer}>
                            <Ionicons name="checkmark-circle" size={50} color="#2ecc71" />
                            <Text style={styles.completedText}>Stage Completed!</Text>
                            {/* Optionally show the score achieved if available */}
                            {/* You might need to fetch/store the score achieved previously */}
                            {/* {assessmentScore !== null && (
                                <Text style={styles.completedScoreText}>
                                    (Score Achieved: {assessmentScore}/10)
                                 </Text>
                             )} */}
                         </View>
                    )}


                    {/* Spacer at the bottom */}
                    {/* <View style={{ height: 60 }} /> */}
                </ScrollView>

                {/* Coin Animation (only shows if passed and animation flag is true) */}
                {showCoinAnimation && assessmentStatus === 'passed' && (
                    <View style={styles.coinAnimationContainer}>
                        <Text style={styles.coinAnimationText}>+{coinAmountAnimated} 🪙</Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};



export default StagePage;
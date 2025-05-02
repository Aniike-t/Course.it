// src/pages/FlashcardPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTrackById } from '../utils/storage'; // Assuming getTrackById fetches the full track data including flashcards

// Helper function to get background color based on difficulty
const getCardColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'easy':
            return '#e8f5e9'; // Light Green
        case 'medium':
            return '#fff3e0'; // Light Orange/Yellow
        case 'hard':
            return '#ffebee'; // Light Red
        default:
            return '#f5f5f5'; // Default Grey
    }
};

// Helper function to get border color based on difficulty
const getBorderColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
        case 'easy':
            return '#a5d6a7'; // Darker Green
        case 'medium':
            return '#ffcc80'; // Darker Orange/Yellow
        case 'hard':
            return '#ef9a9a'; // Darker Red
        default:
            return '#e0e0e0'; // Darker Grey
    }
};

const FlashcardPage = ({ route, navigation }) => {
    const { trackId } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [trackTitle, setTrackTitle] = useState('Flashcards');
    const [flashcards, setFlashcards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [error, setError] = useState(null);
    
    // Animation values
    const flipAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loadFlashcards = async () => {
            if (!trackId) {
                setError("No track ID provided.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const trackData = await getTrackById(trackId);
                if (trackData && trackData.flashcards && trackData.flashcards.length > 0) {
                    setFlashcards(trackData.flashcards);
                    setTrackTitle(trackData.title || 'Flashcards');
                    setCurrentCardIndex(0); // Reset index when data loads
                    setIsFlipped(false);    // Reset flip state
                    flipAnimation.setValue(0); // Reset animation
                } else {
                    setFlashcards([]); // Set empty if no flashcards found
                    setTrackTitle(trackData?.title || 'Flashcards'); // Still set title if track exists
                    setError("No flashcards found for this track."); // Set an info message as error
                }
            } catch (err) {
                console.error("Error loading flashcards:", err);
                setError("Failed to load flashcards. Please try again.");
                setFlashcards([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadFlashcards();
    }, [trackId]); // Reload if trackId changes

    const handleFlipCard = () => {
        // If already animating, don't trigger another animation
        if (flipAnimation._value !== 0 && flipAnimation._value !== 180) return;
        
        // Start the flip animation
        Animated.spring(flipAnimation, {
            toValue: isFlipped ? 0 : 180,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start(() => {
            // This callback runs after animation completes
            setIsFlipped(!isFlipped);
        });
    };

    const handleNextCard = () => {
        if (currentCardIndex < flashcards.length - 1) {
            // Reset flip state and animation
            flipAnimation.setValue(0);
            setIsFlipped(false);
            setCurrentCardIndex(currentCardIndex + 1);
        }
    };

    const handlePreviousCard = () => {
        if (currentCardIndex > 0) {
            // Reset flip state and animation
            flipAnimation.setValue(0);
            setIsFlipped(false);
            setCurrentCardIndex(currentCardIndex - 1);
        }
    };

    // Interpolate flip animation for front and back
    const frontAnimatedStyle = {
        transform: [
            { 
                rotateY: flipAnimation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['0deg', '180deg']
                }) 
            }
        ],
        opacity: flipAnimation.interpolate({
            inputRange: [0, 90, 91, 180],
            outputRange: [1, 0, 0, 0]
        }),
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };

    const backAnimatedStyle = {
        transform: [
            { 
                rotateY: flipAnimation.interpolate({
                    inputRange: [0, 180],
                    outputRange: ['180deg', '360deg']
                }) 
            }
        ],
        opacity: flipAnimation.interpolate({
            inputRange: [0, 89, 90, 180],
            outputRange: [0, 0, 1, 1]
        }),
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };

    // --- Render Logic ---

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Loading...</Text>
                    <View style={{ width: 38 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            </SafeAreaView>
        );
    }

    // Handle error state or no flashcards state
    if (error || flashcards.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{trackTitle}</Text>
                    <View style={{ width: 38 }} />
                </View>
                <View style={styles.centered}>
                    <Text style={styles.infoText}>{error || "No flashcards available for this track."}</Text>
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

    const currentCard = flashcards[currentCardIndex];
    const cardBackgroundColor = getCardColor(currentCard.difficulty);
    const cardBorderColor = getBorderColor(currentCard.difficulty);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{trackTitle}</Text>
                {/* Right spacer to balance title */}
                <View style={{ width: 38 }} />
            </View>

            <View style={styles.content}>
                {/* Card Index */}
                <Text style={styles.cardIndex}>
                    Card {currentCardIndex + 1} of {flashcards.length}
                </Text>

                {/* Flashcard Container */}
                <TouchableOpacity
                    style={[
                        styles.cardContainer,
                        { backgroundColor: 'transparent' }
                    ]}
                    onPress={handleFlipCard}
                    activeOpacity={1}
                >
                    {/* Front Card (Question) */}
                    <Animated.View
                        style={[
                            styles.card,
                            { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
                            frontAnimatedStyle
                        ]}
                    >
                        <Text style={styles.cardText}>{currentCard.question}</Text>
                        <Text style={styles.cardHint}>Tap to see answer</Text>
                    </Animated.View>

                    {/* Back Card (Answer) */}
                    <Animated.View
                        style={[
                            styles.card,
                            { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
                            backAnimatedStyle
                        ]}
                    >
                        <Text style={styles.cardText}>{currentCard.answer}</Text>
                        <Text style={styles.cardHint}>Tap to see question</Text>
                    </Animated.View>
                </TouchableOpacity>

                {/* Navigation Buttons */}
                <View style={styles.navigationButtons}>
                    <TouchableOpacity
                        style={[styles.navButton, currentCardIndex === 0 && styles.navButtonDisabled]}
                        onPress={handlePreviousCard}
                        disabled={currentCardIndex === 0}
                    >
                        <Ionicons name="chevron-back-outline" size={24} color={currentCardIndex === 0 ? "#ccc" : "#333"} />
                        <Text style={[styles.navButtonText, currentCardIndex === 0 && styles.navButtonTextDisabled]}>Prev</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, currentCardIndex === flashcards.length - 1 && styles.navButtonDisabled]}
                        onPress={handleNextCard}
                        disabled={currentCardIndex === flashcards.length - 1}
                    >
                        <Text style={[styles.navButtonText, currentCardIndex === flashcards.length - 1 && styles.navButtonTextDisabled]}>Next</Text>
                        <Ionicons name="chevron-forward-outline" size={24} color={currentCardIndex === flashcards.length - 1 ? "#ccc" : "#333"} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff', // Background color from other pages
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    infoText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
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
    backButton: {
        marginTop: 30,
        padding: 5, // Increase touch target
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        flexShrink: 1, // Allow title to shrink if needed
        marginTop: 30,},
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center', // Center card vertically
    },
    cardIndex: {
        fontSize: 14,
        color: '#777',
        marginBottom: 15,
        fontWeight: '500',
    },
    cardContainer: {
        width: '100%',
        height: 250, // Fixed height for consistency
        position: 'relative',
        marginBottom: 30,
        // Ensure this container is positioned relatively for absolute positioning of cards
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        borderWidth: 2,
        padding: 20,
        justifyContent: 'center', // Center text vertically
        alignItems: 'center', // Center text horizontally
        backfaceVisibility: 'hidden', // Hide the back of the card
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        // elevation: 4,
    },
    cardText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10, // Space between text and hint
    },
    cardHint: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
        position: 'absolute', // Position hint at the bottom
        bottom: 15,
    },
    difficultyText: { // Optional: Style for difficulty indicator
        position: 'absolute',
        top: 10,
        right: 15,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
        textTransform: 'capitalize',
    },
    navigationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20, // Space above buttons
        paddingHorizontal: 10, // Padding for buttons
    },
    navButton: {
        borderWidth: 2,
        borderColor: '#333333',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        backgroundColor: '#e0e0e0',
        minWidth: 100, // Ensure minimum button width
        justifyContent: 'center', // Center content in button
    },
    navButtonDisabled: {
        borderWidth: 0,
        backgroundColor: '#f5f5f5',
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginHorizontal: 5, // Space around text
    },
    navButtonTextDisabled: {
        color: '#ccc',
    },
});

export default FlashcardPage;
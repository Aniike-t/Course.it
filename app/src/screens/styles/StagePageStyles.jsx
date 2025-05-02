import { StyleSheet } from 'react-native';
// --- Styles --- (Includes Assessment and Completed styles)
export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 15,
        paddingBottom: 30,
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
        padding: 5, // Hit area
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3333333',
        flexShrink: 1,
        textAlign: 'center',
        marginTop: 30,
    },
    stageTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#3C3633',
        marginTop: 25,
        marginBottom: 8,
        textAlign: 'center',
         width: '100%',
    },
    creatorText: {
        fontSize: 14,
        color: '#777',
        marginBottom: 25,
        textAlign: 'center',
         width: '100%',
    },
    videoContainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        aspectRatio: 16 / 9,
        borderRadius: 8,
        marginBottom: 20,
        overflow: 'hidden',
         backgroundColor: '#000', // Add black background for player
    },
    videoPlaceholder: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
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
        backgroundColor: '#ebebeb',
        borderRadius: 8,
        marginBottom: 30, // Space before assessment
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
    // --- Assessment Styles ---
    assessmentSection: {
        borderWidth: 2,
        width: '100%',
        marginTop: 10,
        marginBottom: 5,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 13,
        borderColor: '#33333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    assessmentTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 3,
        textAlign: 'center',
    },
    assessmentQuestion: {
        fontSize: 15,
        color: '#555',
        marginBottom: 15,
        lineHeight: 21,
        fontStyle: 'italic',
    },
    answerInput: {
        backgroundColor: '#f8f8f8',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        fontSize: 15,
        color: '#333',
        minHeight: 100, // Ensure good height for multiline
        textAlignVertical: 'top',
    },
    feedbackContainer: {
        marginVertical: 15,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 5,
    },
    feedbackPassed: { // Green for passed
        backgroundColor: '#e8f5e9',
        borderColor: '#4caf50',
    },
    feedbackFailed: { // Red for failed
        backgroundColor: '#ffebee',
        borderColor: '#f44336',
    },
     feedbackNeutral: { // Style for general feedback/errors
        backgroundColor: '#f5f5f5',
        borderColor: '#bdbdbd',
    },
    feedbackTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444',
    },
    feedbackText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 19,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        textAlign: 'right',
    },
    submitButton: {
        backgroundColor: '#3498db', // Submit blue
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
        marginTop: 5, // Add some margin top
    },
    submitButtonDisabled: {
        backgroundColor: '#bdc3c7', // Use a clear disabled color
        elevation: 0,
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    // --- Completed State Styles ---
     completedContainer: {
        marginTop: 30,
        marginBottom: 20, // Add bottom margin
        alignItems: 'center',
        paddingVertical: 20,
         backgroundColor: '#e8f5e9', // Light green background
         borderRadius: 10,
         borderWidth: 1,
         borderColor: '#a5d6a7',
     },
     completedText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32', // Darker green
        marginTop: 10,
     },
     completedScoreText: { // If you decide to show score later
        fontSize: 14,
        color: '#555',
        marginTop: 5,
     },
    // --- Coin Animation Styles ---
    coinAnimationContainer: {
        position: 'absolute',
        bottom: 80, // Adjust if needed
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
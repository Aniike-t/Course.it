import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clearUserData } from '../utils/storage.js';

const SettingsPage = ({ navigation }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const performClearUserData = async () => {
        console.log("SettingsPage - OK confirmed. Performing clear user data.");
        try {
            await clearUserData();
            console.log("SettingsPage - clearUserData finished successfully.");
        } catch (error) {
            console.error("SettingsPage - Error clearing data:", error);
        }
    };

    const handleClearCachePress = () => {
        console.log("SettingsPage - 'Clear User Data' button pressed. Showing modal.");
        setIsModalVisible(true);
    };

    const handleConfirmClear = () => {
        setIsModalVisible(false);
        performClearUserData();
    };

    const handleCancelClear = () => {
        console.log("SettingsPage - Clear data cancelled via modal.");
        setIsModalVisible(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleClearCachePress}>
                    <Text style={styles.buttonText}>Clear User Data</Text>
                </TouchableOpacity>
            </View>

            <Modal
                transparent={true}
                visible={isModalVisible}
                animationType="fade"
                onRequestClose={handleCancelClear}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Clear Data</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to clear all user progress, tracks and coins? This action cannot be undone.
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={handleCancelClear}
                            >
                                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleConfirmClear}
                            >
                                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <Text style={styles.AboutText}>Made by Aniket V Mahajan</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    AboutText:{
        fontSize: 10,
        color: '#3333333',
        textAlign: 'center',
        marginTop: 10,
        marginBottom:10
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 20,
    },
    backButton: {
        padding: 5,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#e74c3c',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalMessage: {
        fontSize: 12,
        textAlign: 'justify',
        marginBottom: 15,
        lineHeight: 22,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    modalButton: {
        width:'100%',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flex: 1,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    cancelButtonText: {
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#e74c3c',
    },
    confirmButtonText: {
        color: 'white',
    },
});

export default SettingsPage;
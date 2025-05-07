import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // Import bottom tabs
import { Ionicons } from '@expo/vector-icons'; // Import Icons

// Import Screens
import Homepage from './src/screens/Homepage.jsx';
import TrackPage from './src/screens/TrackPage.jsx';
import StagePage from './src/screens/StagePage.jsx';
import SettingsPage from './src/screens/SettingsPage.jsx';
import ReportPage from './src/screens/ReportPage.jsx';   // Import new screen
import ProfilePage from './src/screens/ProfilePage.jsx'; // Import new screen
import PersonalTrackPage from './src/screens/PersonalTrackPage.jsx'
import FlashcardPage from './src/screens/FlashcardPage.jsx';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator(); // Create Tab navigator instance

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              backgroundColor: '#ffffff',
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="Homepage" component={Homepage} />
      <Stack.Screen name="TrackPage" component={TrackPage} />
      <Stack.Screen name="StagePage" component={StagePage} />
      <Stack.Screen name="SettingsPage" component={SettingsPage} />
      <Stack.Screen name="PersonalTrackPage" component={PersonalTrackPage} />
      <Stack.Screen name="FlashcardPage" component={FlashcardPage} />
      {/* Login and signup pages will be added later */}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer >
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Report') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person-circle' : 'person-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },

          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            paddingTop: 3,
            borderTopEndRadius: 25,
            borderTopStartRadius: 25,
            backgroundColor: '#ededed',
            paddingBottom: 5,
            height: 40,
          },
          tabBarLabelStyle: {
            fontSize: 1,
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStackNavigator}
          options={{ tabBarLabel: 'Learn' }}
        />
        <Tab.Screen
          name="Report"
          component={ReportPage}
        />
        <Tab.Screen
          name="Profile"
          component={ProfilePage}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
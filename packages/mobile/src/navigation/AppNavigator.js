import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import LeadsPoolScreen from '../screens/LeadsPoolScreen';
import NewLeadScreen from '../screens/NewLeadScreen';
import OnboardingJourneyScreen from '../screens/OnboardingJourneyScreen';
import RejectionScreen from '../screens/RejectionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8, borderTopColor: colors.borderLight },
        tabBarLabelStyle: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = { Home: focused ? 'home' : 'home-outline', Search: focused ? 'search' : 'search-outline', Metrics: focused ? 'bar-chart' : 'bar-chart-outline', Profile: focused ? 'person' : 'person-outline' };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={() => null} />
      <Tab.Screen name="Metrics" component={() => null} />
      <Tab.Screen name="Profile" component={() => null} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="LeadsPool" component={LeadsPoolScreen} />
        <Stack.Screen name="NewLead" component={NewLeadScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="OnboardingJourney" component={OnboardingJourneyScreen} />
        <Stack.Screen name="Rejection" component={RejectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

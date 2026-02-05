// App.js
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./context/AuthContext";
import { WorkoutProvider } from "./context/WorkoutContext";

import Login from "./pages/LoginScreen";
import Register from "./pages/RegisterScreen";
import Dashboard from "./pages/DashboardScreen";
import ActiveWorkoutScreen from "./pages/ActiveWorkoutScreen";
import WorkoutSummaryScreen from "./pages/WorkoutSummaryScreen";
import { GeminiProvider } from "./context/GeminiContext";
import GeminiChatScreen from "./pages/GeminiChatScreen";
import InjuryPredictor from "./pages/InjuryPredictorScreen";

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkLogin();
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <AuthContext.Provider value={{ setIsLoggedIn }}>
        <GeminiProvider>
      <WorkoutProvider>
        <NavigationContainer>
          <Stack.Navigator>
            {isLoggedIn ? (
              <>
                <Stack.Screen
                  name="Dashboard"
                  component={Dashboard}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ActiveWorkout"
                  component={ActiveWorkoutScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="WorkoutSummary"
                  component={WorkoutSummaryScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
  name="GeminiChat" 
  component={GeminiChatScreen} 
  options={{ headerShown: false }}
/>


<Stack.Screen 
  name="InjuryPredictor" 
  component={InjuryPredictor}
  options={{
    headerShown: false,
    title: 'Injury Predictor'
  }}
/>


              </>
            ) : (
              <>
                <Stack.Screen 
                  name="Login" 
                  component={Login} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Register" 
                  component={Register} 
                  options={{ headerShown: false }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </WorkoutProvider>
      </GeminiProvider>
    </AuthContext.Provider>
  );
}
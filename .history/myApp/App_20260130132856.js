mport { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./context/AuthContext";

import Login from "./pages/LoginScreen";
import Register from "./pages/RegisterScreen";
import Dashboard from "./pages/DashboardScreen";

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

if (loading) return null;

return (
<AuthContext.Provider value={{ setIsLoggedIn }}>
<NavigationContainer>
<Stack.Navigator>
{isLoggedIn ? (
<Stack.Screen
name="Dashboard"
component={Dashboard}
options={{ headerShown: false }}
/>
) : (
<>
<Stack.Screen name="Login" component={Login} />
<Stack.Screen name="Register" component={Register} />
</>
)}
</Stack.Navigator>
</NavigationContainer>
</AuthContext.Provider>
);
}


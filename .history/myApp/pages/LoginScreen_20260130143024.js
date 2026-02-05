

import {
View,
TextInput,
TouchableOpacity,
Text,
StyleSheet,
Image,
KeyboardAvoidingView,
Platform,
ScrollView
} from "react-native";
import { useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";

export default function Login({ navigation }) {
const { setIsLoggedIn } = useContext(AuthContext);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

const login = async () => {
setLoading(true);
try {
const res = await fetch("http://192.168.0.115:5000/api/auth/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email, password }),
});

const data = await res.json();

if (data.token) {
await AsyncStorage.setItem("token", data.token);
await AsyncStorage.setItem("user", JSON.stringify(data.user));
setIsLoggedIn(true);
}
} catch (error) {
console.error("Login error:", error);
} finally {
setLoading(false);
}
};

return (
<KeyboardAvoidingView
style={styles.container}
behavior={Platform.OS === "ios" ? "padding" : "height"}
>
<ScrollView contentContainerStyle={styles.scrollContainer}>
{/* Header */}
<View style={styles.header}>

<Text style={styles.appTitle}>HealthAI</Text>
<Text style={styles.subtitle}>Fitness & Disease Prediction</Text>
</View>

{/* Login Form */}
<View style={styles.formContainer}>
<Text style={styles.loginTitle}>Welcome Back</Text>
<Text style={styles.loginSubtitle}>Sign in to continue your health journey</Text>

{/* Email Input */}
<View style={styles.inputContainer}>
<Text style={styles.inputLabel}>Email Address</Text>
<TextInput
placeholder="Enter your email"
placeholderTextColor="#999"
value={email}
onChangeText={setEmail}
autoCapitalize="none"
keyboardType="email-address"
style={styles.input}
/>
</View>

{/* Password Input */}
<View style={styles.inputContainer}>
<Text style={styles.inputLabel}>Password</Text>
<TextInput
placeholder="Enter your password"
placeholderTextColor="#999"
value={password}
onChangeText={setPassword}
secureTextEntry
style={styles.input}
/>
</View>

{/* Forgot Password */}
<TouchableOpacity style={styles.forgotPassword}>
<Text style={styles.forgotPasswordText}>Forgot Password?</Text>
</TouchableOpacity>

{/* Login Button */}
<TouchableOpacity
style={[styles.loginButton, loading && styles.loginButtonDisabled]}
onPress={login}
disabled={loading}
>
<Text style={styles.loginButtonText}>
{loading ? "Logging in..." : "Sign In"}
</Text>
</TouchableOpacity>

{/* Divider */}
<View style={styles.dividerContainer}>
<View style={styles.divider} />
<Text style={styles.dividerText}>OR</Text>
<View style={styles.divider} />
</View>

{/* Register Section */}
<View style={styles.registerContainer}>
<Text style={styles.registerText}>New to HealthAI?</Text>
<TouchableOpacity onPress={() => navigation.navigate("Register")}>
<Text style={styles.registerLink}>Create Account</Text>
</TouchableOpacity>
</View>

{/* Features Preview */}
<View style={styles.featuresContainer}>
<Text style={styles.featuresTitle}>What you'll get:</Text>
<View style={styles.featureItem}>
<Text style={styles.featureIcon}>🏃</Text>
<Text style={styles.featureText}>Personalized Fitness Plans</Text>
</View>
<View style={styles.featureItem}>
<Text style={styles.featureIcon}>🩺</Text>
<Text style={styles.featureText}>Health Risk Predictions</Text>
</View>
<View style={styles.featureItem}>
<Text style={styles.featureIcon}>📊</Text>
<Text style={styles.featureText}>Detailed Analytics</Text>
</View>
</View>
</View>
</ScrollView>
</KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#f8fafc',
},
scrollContainer: {
flexGrow: 1,
paddingBottom: 40,
},
header: {
alignItems: 'center',
paddingTop: 30,
paddingBottom: 20,
backgroundColor: 'white',
borderBottomLeftRadius: 30,
borderBottomRightRadius: 30,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 8,
elevation: 5,
},

appTitle: {
fontSize: 32,
fontWeight: 'bold',
color: '#2563eb',
marginBottom: 5,
},
subtitle: {
fontSize: 14,
color: '#64748b',
fontWeight: '500',
},
formContainer: {
paddingHorizontal: 25,
paddingTop: 40,
},
loginTitle: {
fontSize: 28,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 8,
},
loginSubtitle: {
fontSize: 16,
color: '#64748b',
marginBottom: 30,
},
inputContainer: {
marginBottom: 20,
},
inputLabel: {
fontSize: 14,
fontWeight: '600',
color: '#475569',
marginBottom: 8,
},
input: {
backgroundColor: 'white',
borderWidth: 1,
borderColor: '#e2e8f0',
borderRadius: 12,
paddingHorizontal: 16,
paddingVertical: 14,
fontSize: 16,
color: '#1e293b',
shadowColor: '#000',
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 0.05,
shadowRadius: 2,
elevation: 2,
},
forgotPassword: {
alignItems: 'flex-end',
marginBottom: 25,
},
forgotPasswordText: {
color: '#2563eb',
fontSize: 14,
fontWeight: '600',
},
loginButton: {
backgroundColor: '#2563eb',
borderRadius: 12,
paddingVertical: 16,
alignItems: 'center',
shadowColor: '#2563eb',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 5,
},
loginButtonDisabled: {
backgroundColor: '#93c5fd',
},
loginButtonText: {
color: 'white',
fontSize: 16,
fontWeight: 'bold',
},
dividerContainer: {
flexDirection: 'row',
alignItems: 'center',
marginVertical: 30,
},
divider: {
flex: 1,
height: 1,
backgroundColor: '#e2e8f0',
},
dividerText: {
marginHorizontal: 15,
color: '#94a3b8',
fontSize: 14,
fontWeight: '500',
},
registerContainer: {
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
marginBottom: 40,
},
registerText: {
color: '#64748b',
fontSize: 15,
marginRight: 5,
},
registerLink: {
color: '#2563eb',
fontSize: 15,
fontWeight: 'bold',
},
featuresContainer: {
backgroundColor: 'white',
borderRadius: 16,
padding: 20,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 8,
elevation: 3,
},
featuresTitle: {
fontSize: 18,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 15,
},
featureItem: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12,
},
featureIcon: {
fontSize: 20,
marginRight: 12,
},
featureText: {
fontSize: 15,
color: '#475569',
},
}); 


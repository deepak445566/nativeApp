import {
View,
TextInput,
TouchableOpacity,
Text,
StyleSheet,
Image,
KeyboardAvoidingView,
Platform,
ScrollView,
Alert,
ActivityIndicator
} from "react-native";
import { useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import Icon from 'react-native-vector-icons/MaterialIcons'; // Install: npm install react-native-vector-icons

export default function Register({ navigation }) {
const { setIsLoggedIn } = useContext(AuthContext);
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [loading, setLoading] = useState(false);
const [passwordVisible, setPasswordVisible] = useState(false);
const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

const validateForm = () => {
if (!name.trim()) {
Alert.alert("Validation Error", "Please enter your name");
return false;
}
if (!email.trim() || !email.includes('@')) {
Alert.alert("Validation Error", "Please enter a valid email");
return false;
}
if (password.length < 6) {
Alert.alert("Validation Error", "Password must be at least 6 characters");
return false;
}
if (password !== confirmPassword) {
Alert.alert("Validation Error", "Passwords do not match");
return false;
}
return true;
};

const register = async () => {
if (!validateForm()) return;

setLoading(true);
try {
const registerResponse = await fetch("http://localhost:5000/api/auth/register", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ name, email, password }),
});

if (!registerResponse.ok) {
throw new Error("Registration failed");
}

// Auto login after successful registration
const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ email, password }),
});

const data = await loginResponse.json();

if (data.token) {
await AsyncStorage.setItem("token", data.token);
await AsyncStorage.setItem("user", JSON.stringify(data.user));
setIsLoggedIn(true);
Alert.alert("Success", "Account created successfully!");
}
} catch (error) {
Alert.alert("Error", error.message || "Something went wrong. Please try again.");
} finally {
setLoading(false);
}
};

return (
<KeyboardAvoidingView
style={styles.container}
behavior={Platform.OS === "ios" ? "padding" : "height"}
>
<ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
{/* Back Button */}



{/* Registration Form */}
<View style={styles.formContainer}>
<Text style={styles.registerTitle}>Create Account</Text>
<Text style={styles.registerSubtitle}>Fill in your details to get started</Text>

{/* Name Input */}
<View style={styles.inputContainer}>
<View style={styles.labelContainer}>
<Icon name="person-outline" size={18} color="#64748b" />
<Text style={styles.inputLabel}>Full Name</Text>
</View>
<TextInput
placeholder="Enter your full name"
placeholderTextColor="#999"
value={name}
onChangeText={setName}
style={styles.input}
autoCapitalize="words"
/>
</View>

{/* Email Input */}
<View style={styles.inputContainer}>
<View style={styles.labelContainer}>
<Icon name="email" size={18} color="#64748b" />
<Text style={styles.inputLabel}>Email Address</Text>
</View>
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
<View style={styles.labelContainer}>
<Icon name="lock-outline" size={18} color="#64748b" />
<Text style={styles.inputLabel}>Password</Text>
</View>
<View style={styles.passwordContainer}>
<TextInput
placeholder="Create a password (min. 6 characters)"
placeholderTextColor="#999"
value={password}
onChangeText={setPassword}
secureTextEntry={!passwordVisible}
style={[styles.input, styles.passwordInput]}
/>
<TouchableOpacity
style={styles.eyeIcon}
onPress={() => setPasswordVisible(!passwordVisible)}
>
<Icon
name={passwordVisible ? "visibility" : "visibility-off"}
size={22}
color="#64748b"
/>
</TouchableOpacity>
</View>
{password.length > 0 && password.length < 6 && (
<Text style={styles.validationText}>Password must be at least 6 characters</Text>
)}
</View>

{/* Confirm Password Input */}
<View style={styles.inputContainer}>
<View style={styles.labelContainer}>
<Icon name="lock-outline" size={18} color="#64748b" />
<Text style={styles.inputLabel}>Confirm Password</Text>
</View>
<View style={styles.passwordContainer}>
<TextInput
placeholder="Confirm your password"
placeholderTextColor="#999"
value={confirmPassword}
onChangeText={setConfirmPassword}
secureTextEntry={!confirmPasswordVisible}
style={[styles.input, styles.passwordInput]}
/>
<TouchableOpacity
style={styles.eyeIcon}
onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
>
<Icon
name={confirmPasswordVisible ? "visibility" : "visibility-off"}
size={22}
color="#64748b"
/>
</TouchableOpacity>
</View>
{confirmPassword.length > 0 && password !== confirmPassword && (
<Text style={styles.validationError}>Passwords do not match</Text>
)}
{confirmPassword.length > 0 && password === confirmPassword && password.length >= 6 && (
<Text style={styles.validationSuccess}>Passwords match ✓</Text>
)}
</View>



{/* Terms and Conditions */}
<TouchableOpacity style={styles.termsContainer}>
<View style={styles.checkbox}>
<Icon name="check" size={16} color="white" />
</View>
<Text style={styles.termsText}>
I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
</Text>
</TouchableOpacity>

{/* Register Button */}
<TouchableOpacity
style={[styles.registerButton, loading && styles.registerButtonDisabled]}
onPress={register}
disabled={loading}
>
{loading ? (
<ActivityIndicator color="white" />
) : (
<>
<Icon name="person-add" size={20} color="white" style={styles.buttonIcon} />
<Text style={styles.registerButtonText}>Create Account</Text>
</>
)}
</TouchableOpacity>

{/* Divider */}
<View style={styles.dividerContainer}>
<View style={styles.divider} />
<Text style={styles.dividerText}>OR</Text>
<View style={styles.divider} />
</View>

{/* Already have account */}
<View style={styles.loginContainer}>
<Text style={styles.loginText}>Already have an account?</Text>
<TouchableOpacity onPress={() => navigation.navigate("Login")}>
<Text style={styles.loginLink}>Sign In</Text>
</TouchableOpacity>
</View>

{/* Benefits Section */}
<View style={styles.benefitsContainer}>
<Text style={styles.benefitsTitle}>Why join HealthAI?</Text>
<View style={styles.benefitItem}>
<Icon name="monitor-heart" size={24} color="#2563eb" />
<View style={styles.benefitContent}>
<Text style={styles.benefitTitle}>Health Predictions</Text>
<Text style={styles.benefitDescription}>Get AI-powered disease risk assessments</Text>
</View>
</View>
<View style={styles.benefitItem}>
<Icon name="fitness-center" size={24} color="#2563eb" />
<View style={styles.benefitContent}>
<Text style={styles.benefitTitle}>Personalized Fitness</Text>
<Text style={styles.benefitDescription}>Custom workout and diet plans</Text>
</View>
</View>
<View style={styles.benefitItem}>
<Icon name="trending-up" size={24} color="#2563eb" />
<View style={styles.benefitContent}>
<Text style={styles.benefitTitle}>Progress Tracking</Text>
<Text style={styles.benefitDescription}>Monitor your health journey</Text>
</View>
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
backButton: {
position: 'absolute',
top: 30,
left: 20,
zIndex: 10,
backgroundColor: 'white',
borderRadius: 20,
padding: 8,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 3,
},


appTitle: {
fontSize: 28,
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
registerTitle: {
fontSize: 28,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 8,
},
registerSubtitle: {
fontSize: 16,
color: '#64748b',
marginBottom: 30,
},
inputContainer: {
marginBottom: 20,
},
labelContainer: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 8,
},
inputLabel: {
fontSize: 14,
fontWeight: '600',
color: '#475569',
marginLeft: 8,
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
passwordContainer: {
position: 'relative',
},
passwordInput: {
paddingRight: 50,
},
eyeIcon: {
position: 'absolute',
right: 16,
top: 14,
},
validationText: {
color: '#f59e0b',
fontSize: 12,
marginTop: 5,
marginLeft: 5,
},
validationError: {
color: '#ef4444',
fontSize: 12,
marginTop: 5,
marginLeft: 5,
},
validationSuccess: {
color: '#10b981',
fontSize: 12,
marginTop: 5,
marginLeft: 5,
},
requirementsContainer: {
backgroundColor: '#f1f5f9',
borderRadius: 8,
padding: 12,
marginBottom: 20,
},
requirementsTitle: {
color: '#475569',
fontSize: 13,
fontWeight: '600',
marginBottom: 8,
},
requirementItem: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 4,
},
requirementText: {
color: '#64748b',
fontSize: 12,
marginLeft: 8,
},
termsContainer: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 25,
},
checkbox: {
width: 20,
height: 20,
borderRadius: 4,
backgroundColor: '#2563eb',
justifyContent: 'center',
alignItems: 'center',
marginRight: 10,
},
termsText: {
color: '#64748b',
fontSize: 13,
flex: 1,
flexWrap: 'wrap',
},
termsLink: {
color: '#2563eb',
fontWeight: '600',
},
registerButton: {
backgroundColor: '#2563eb',
borderRadius: 12,
paddingVertical: 16,
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
shadowColor: '#2563eb',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 8,
elevation: 5,
},
registerButtonDisabled: {
backgroundColor: '#93c5fd',
},
buttonIcon: {
marginRight: 8,
},
registerButtonText: {
color: 'white',
fontSize: 16,
fontWeight: 'bold',
},
dividerContainer: {
flexDirection: 'row',
alignItems: 'center',
marginVertical: 25,
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
loginContainer: {
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
marginBottom: 30,
},
loginText: {
color: '#64748b',
fontSize: 15,
marginRight: 5,
},
loginLink: {
color: '#2563eb',
fontSize: 15,
fontWeight: 'bold',
},
benefitsContainer: {
backgroundColor: 'white',
borderRadius: 16,
padding: 20,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 8,
elevation: 3,
},
benefitsTitle: {
fontSize: 18,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 15,
},
benefitItem: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 20,
},
benefitContent: {
marginLeft: 15,
flex: 1,
},
benefitTitle: {
fontSize: 15,
fontWeight: '600',
color: '#1e293b',
marginBottom: 2,
},
benefitDescription: {
fontSize: 13,
color: '#64748b',
},
});

      


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
const res = await fetch("http://localhos// pages/DashboardScreen.js
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { MaterialIcons as Icon } from "@expo/vector-icons"; // Expo compatible icons
import { LinearGradient } from "expo-linear-gradient";

export default function Dashboard({ navigation }) {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('');

  const [goals, setGoals] = useState({
    steps: 10000,
    calories: 2500,
    workouts: 5,
    water: 3.5
  });

  const workouts = [
    { id: 1, title: "Full Body Workout", description: "Build Strength, Boost Endurance, And Challenge Every Muscle", duration: "30 min", icon: "🏋️", color: "#FF6B6B" },
    { id: 2, title: "Cardio Burn", description: "High intensity cardio for fat burning", duration: "45 min", icon: "🏃", color: "#4ECDC4" },
    { id: 3, title: "Yoga & Stretch", description: "Improve flexibility and reduce stress", duration: "25 min", icon: "🧘", color: "#95E1D3" },
    { id: 4, title: "Strength Training", description: "Build muscle and increase strength", duration: "40 min", icon: "💪", color: "#FFD166" }
  ];

  useEffect(() => {
    AsyncStorage.getItem("user").then(data => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = parseFloat(height) / 100;
      const bmiValue = parseFloat(weight) / (heightInMeters * heightInMeters);
      setBmi(bmiValue.toFixed(1));

      if (bmiValue < 18.5) setBmiCategory("Underweight");
      else if (bmiValue < 25) setBmiCategory("Normal");
      else if (bmiValue < 30) setBmiCategory("Overweight");
      else setBmiCategory("Obese");
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    setIsLoggedIn(false);
  };

  const getBmiColor = () => {
    if (!bmi) return '#94a3b8';
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) return '#3B82F6';
    if (bmiNum < 25) return '#10B981';
    if (bmiNum < 30) return '#F59E0B';
    return '#EF4444';
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>{user.name.split(' ')[0]} 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.iconButton}>
              <Icon name="logout" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.motivation}>One Step Closer To Your Goal</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* BMI Card */}
        <TouchableOpacity style={styles.bmiCard} onPress={() => setBmiModalVisible(true)}>
          <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.bmiGradient}>
            <View style={styles.bmiContent}>
              <View>
                <Text style={styles.bmiTitle}>BMI Calculator</Text>
                <Text style={styles.bmiSubtitle}>Check your body health</Text>
              </View>
              {bmi ? (
                <View style={styles.bmiResult}>
                  <Text style={[styles.bmiValue, { color: getBmiColor() }]}>{bmi}</Text>
                  <Text style={styles.bmiCategory}>{bmiCategory}</Text>
                </View>
              ) : (
                <Icon name="calculate" size={40} color="white" />
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Goals</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsContainer}>
            {Object.entries(goals).map(([key, value]) => (
              <View key={key} style={styles.goalCard}>
                <View style={[styles.goalIcon, { backgroundColor: '#2563eb20' }]}>
                  <Text>{key}</Text>
                </View>
                <Text style={styles.goalValue}>{value}</Text>
                <Text style={styles.goalLabel}>{key}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Plan</Text>
          {workouts.map(workout => (
            <TouchableOpacity key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={[styles.workoutIcon, { backgroundColor: workout.color + '20' }]}>
                  <Text style={styles.workoutEmoji}>{workout.icon}</Text>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle}>{workout.title}</Text>
                  <Text style={styles.workoutDescription}>{workout.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* BMI Modal */}
      <Modal animationType="slide" transparent={true} visible={bmiModalVisible} onRequestClose={() => setBmiModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>BMI Calculator</Text>
              <TouchableOpacity onPress={() => setBmiModalVisible(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="Enter weight" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={height} onChangeText={setHeight} placeholder="Enter height" />
            </View>
            <TouchableOpacity style={styles.calculateButton} onPress={calculateBMI}>
              <Text style={styles.calculateButtonText}>Calculate BMI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  greeting: { color: 'white', fontSize: 16, opacity: 0.9 },
  userName: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  motivation: { color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  content: { flex: 1, padding: 25 },
  bmiCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 25 },
  bmiGradient: { padding: 20 },
  bmiContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bmiTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  bmiSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  bmiResult: { alignItems: 'center' },
  bmiValue: { fontSize: 36, fontWeight: 'bold' },
  bmiCategory: { color: 'white', fontSize: 14, marginTop: 4 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  goalsContainer: { flexDirection: 'row' },
  goalCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginRight: 15, minWidth: 120 },
  goalIcon: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  goalValue: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  goalLabel: { fontSize: 14, color: '#64748b', marginTop: 2 },
  workoutCard: { backgroundColor: 'white', borderRadius: 15, padding: 20, marginBottom: 15 },
  workoutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  workoutIcon: { width: 60, height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  workoutEmoji: { fontSize: 28 },
  workoutInfo: { flex: 1 },
  workoutTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  workoutDescription: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1e293b' },
  calculateButton: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  calculateButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
:5000/api/auth/login", {
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


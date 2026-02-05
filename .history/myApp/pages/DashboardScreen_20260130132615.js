

import {
View,
Text,
TouchableOpacity,
StyleSheet,
ScrollView,
Image,
TextInput,
Modal,
ActivityIndicator
} from "react-native";
import { useEffect, useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Dashboard({ navigation }) {
const { setIsLoggedIn } = useContext(AuthContext);
const [user, setUser] = useState(null);
const [activeTab, setActiveTab] = useState('home');
const [bmiModalVisible, setBmiModalVisible] = useState(false);
const [weight, setWeight] = useState('');
const [height, setHeight] = useState('');
const [bmi, setBmi] = useState(null);
const [bmiCategory, setBmiCategory] = useState('');
const [loading, setLoading] = useState(false);

// User goals data
const [goals, setGoals] = useState({
steps: 10000,
calories: 2500,
workouts: 5,
water: 3.5
});

const workouts = [
{
id: 1,
title: "Full Body Workout",
description: "Build Strength, Boost Endurance, And Challenge Every Muscle",
duration: "30 min",
type: "muscle",
icon: "🏋️",
color: "#FF6B6B"
},
{
id: 2,
title: "Cardio Burn",
description: "High intensity cardio for fat burning",
duration: "45 min",
type: "cardio",
icon: "🏃",
color: "#4ECDC4"
},
{
id: 3,
title: "Yoga & Stretch",
description: "Improve flexibility and reduce stress",
duration: "25 min",
type: "mind",
icon: "🧘",
color: "#95E1D3"
},
{
id: 4,
title: "Strength Training",
description: "Build muscle and increase strength",
duration: "40 min",
type: "strength",
icon: "💪",
color: "#FFD166"
}
];

useEffect(() => {
AsyncStorage.getItem("user").then((data) => {
setUser(JSON.parse(data));
});
}, []);

const calculateBMI = () => {
if (weight && height) {
const heightInMeters = parseFloat(height) / 100;
const bmiValue = parseFloat(weight) / (heightInMeters * heightInMeters);
setBmi(bmiValue.toFixed(1));

if (bmiValue < 18.5) setBmiCategory("Underweight");
else if (bmiValue >= 18.5 && bmiValue < 25) setBmiCategory("Normal");
else if (bmiValue >= 25 && bmiValue < 30) setBmiCategory("Overweight");
else setBmiCategory("Obese");
}
};

const logout = async () => {
await AsyncStorage.clear();
setIsLoggedIn(false);
};

if (!user) {
return (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color="#2563eb" />
</View>
);
}

const getBmiColor = () => {
if (!bmi) return '#94a3b8';
const bmiNum = parseFloat(bmi);
if (bmiNum < 18.5) return '#3B82F6'; // Blue
if (bmiNum < 25) return '#10B981'; // Green
if (bmiNum < 30) return '#F59E0B'; // Orange
return '#EF4444'; // Red
};

return (
<View style={styles.container}>
{/* Header */}
<LinearGradient
colors={['#2563eb', '#1d4ed8']}
style={styles.header}
>
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
{/* BMI Calculator Card */}
<TouchableOpacity
style={styles.bmiCard}
onPress={() => setBmiModalVisible(true)}
>
<LinearGradient
colors={['#6366f1', '#4f46e5']}
style={styles.bmiGradient}
start={{x: 0, y: 0}}
end={{x: 1, y: 0}}
>
<View style={styles.bmiContent}>
<View>
<Text style={styles.bmiTitle}>BMI Calculator</Text>
<Text style={styles.bmiSubtitle}>Check your body health</Text>
</View>
{bmi ? (
<View style={styles.bmiResult}>
<Text style={[styles.bmiValue, {color: getBmiColor()}]}>{bmi}</Text>
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
<TouchableOpacity>
<Text style={styles.seeMore}>See All</Text>
</TouchableOpacity>
</View>

<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsContainer}>
<View style={styles.goalCard}>
<View style={[styles.goalIcon, {backgroundColor: '#FF6B6B20'}]}>
<Icon name="directions-run" size={24} color="#FF6B6B" />
</View>
<Text style={styles.goalValue}>8,432</Text>
<Text style={styles.goalLabel}>Steps</Text>
<Text style={styles.goalTarget}>Target: {goals.steps}</Text>
</View>

<View style={styles.goalCard}>
<View style={[styles.goalIcon, {backgroundColor: '#4ECDC420'}]}>
<Icon name="local-fire-department" size={24} color="#4ECDC4" />
</View>
<Text style={styles.goalValue}>1,850</Text>
<Text style={styles.goalLabel}>Calories</Text>
<Text style={styles.goalTarget}>Target: {goals.calories}</Text>
</View>

<View style={styles.goalCard}>
<View style={[styles.goalIcon, {backgroundColor: '#2563eb20'}]}>
<Icon name="fitness-center" size={24} color="#2563eb" />
</View>
<Text style={styles.goalValue}>3</Text>
<Text style={styles.goalLabel}>Workouts</Text>
<Text style={styles.goalTarget}>Target: {goals.workouts}</Text>
</View>

<View style={styles.goalCard}>
<View style={[styles.goalIcon, {backgroundColor: '#3B82F620'}]}>
<Icon name="water-drop" size={24} color="#3B82F6" />
</View>
<Text style={styles.goalValue}>2.1L</Text>
<Text style={styles.goalLabel}>Water</Text>
<Text style={styles.goalTarget}>Target: {goals.water}L</Text>
</View>
</ScrollView>
</View>

{/* Workout Categories */}
<View style={styles.section}>
<View style={styles.sectionHeader}>
<Text style={styles.sectionTitle}>Workout Categories</Text>
<TouchableOpacity>
<Text style={styles.seeMore}>View All</Text>
</TouchableOpacity>
</View>

<View style={styles.categoryContainer}>
{['All Workouts', 'Full Body', 'Lower Body', 'Upper Body', 'Cardio', 'Yoga'].map((category, index) => (
<TouchableOpacity
key={index}
style={[
styles.categoryPill,
index === 0 && styles.activeCategoryPill
]}
>
<Text style={[
styles.categoryText,
index === 0 && styles.activeCategoryText
]}>
{category}
</Text>
</TouchableOpacity>
))}
</View>
</View>

{/* Your Plan Section */}
<View style={styles.section}>
<View style={styles.sectionHeader}>
<Text style={styles.sectionTitle}>Your Plan</Text>
<TouchableOpacity>
<Text style={styles.seeMore}>See More</Text>
</TouchableOpacity>
</View>

{workouts.map((workout) => (
<TouchableOpacity key={workout.id} style={styles.workoutCard}>
<View style={styles.workoutHeader}>
<View style={[styles.workoutIcon, {backgroundColor: workout.color + '20'}]}>
<Text style={styles.workoutEmoji}>{workout.icon}</Text>
</View>
<View style={styles.workoutInfo}>
<Text style={styles.workoutTitle}>{workout.title}</Text>
<Text style={styles.workoutDescription}>{workout.description}</Text>
</View>
</View>
<View style={styles.workoutFooter}>
<View style={styles.workoutDuration}>
<Icon name="schedule" size={16} color="#64748b" />
<Text style={styles.durationText}>{workout.duration}</Text>
</View>
<TouchableOpacity style={styles.startButton}>
<Text style={styles.startButtonText}>Start</Text>
<Icon name="arrow-forward" size={16} color="white" />
</TouchableOpacity>
</View>
</TouchableOpacity>
))}
</View>

{/* Health Tips */}
<View style={styles.tipsContainer}>
<Text style={styles.tipsTitle}>💡 Health Tip</Text>
<Text style={styles.tipText}>
Drink a glass of water 30 minutes before meals to aid digestion and control appetite.
</Text>
</View>
</ScrollView>

{/* BMI Modal */}
<Modal
animationType="slide"
transparent={true}
visible={bmiModalVisible}
onRequestClose={() => setBmiModalVisible(false)}
>
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
<TextInput
style={styles.input}
placeholder="Enter weight"
keyboardType="numeric"
value={weight}
onChangeText={setWeight}
/>
</View>

<View style={styles.inputGroup}>
<Text style={styles.inputLabel}>Height (cm)</Text>
<TextInput
style={styles.input}
placeholder="Enter height"
keyboardType="numeric"
value={height}
onChangeText={setHeight}
/>
</View>

<TouchableOpacity
style={styles.calculateButton}
onPress={calculateBMI}
>
<Text style={styles.calculateButtonText}>Calculate BMI</Text>
</TouchableOpacity>

{bmi && (
<View style={styles.resultContainer}>
<Text style={styles.resultTitle}>Your Result:</Text>
<View style={styles.bmiResultContainer}>
<Text style={[styles.bmiResultValue, {color: getBmiColor()}]}>{bmi}</Text>
<View style={[styles.bmiCategoryBadge, {backgroundColor: getBmiColor() + '20'}]}>
<Text style={[styles.bmiCategoryText, {color: getBmiColor()}]}>{bmiCategory}</Text>
</View>
</View>
<Text style={styles.bmiInfo}>
{bmiCategory === "Normal"
? "Great! You're in the healthy range."
: "Consider consulting with a health professional."}
</Text>
</View>
)}
</View>
</View>
</Modal>
</View>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#f8fafc',
},
loadingContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
},
header: {
paddingTop: 60,
paddingBottom: 30,
paddingHorizontal: 25,
borderBottomLeftRadius: 30,
borderBottomRightRadius: 30,
},
headerTop: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 15,
},
greeting: {
color: 'white',
fontSize: 16,
opacity: 0.9,
},
userName: {
color: 'white',
fontSize: 28,
fontWeight: 'bold',
},
headerIcons: {
flexDirection: 'row',
gap: 15,
},
iconButton: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: 'rgba(255,255,255,0.2)',
justifyContent: 'center',
alignItems: 'center',
},
motivation: {
color: 'white',
fontSize: 18,
fontWeight: '600',
textAlign: 'center',
marginTop: 10,
},
content: {
flex: 1,
padding: 25,
},
bmiCard: {
borderRadius: 20,
overflow: 'hidden',
marginBottom: 25,
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.2,
shadowRadius: 8,
elevation: 5,
},
bmiGradient: {
padding: 20,
},
bmiContent: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
bmiTitle: {
color: 'white',
fontSize: 20,
fontWeight: 'bold',
},
bmiSubtitle: {
color: 'rgba(255,255,255,0.8)',
fontSize: 14,
marginTop: 4,
},
bmiResult: {
alignItems: 'center',
},
bmiValue: {
fontSize: 36,
fontWeight: 'bold',
},
bmiCategory: {
color: 'white',
fontSize: 14,
marginTop: 4,
},
section: {
marginBottom: 25,
},
sectionHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 15,
},
sectionTitle: {
fontSize: 20,
fontWeight: 'bold',
color: '#1e293b',
},
seeMore: {
color: '#2563eb',
fontSize: 14,
fontWeight: '600',
},
goalsContainer: {
flexDirection: 'row',
},
goalCard: {
backgroundColor: 'white',
borderRadius: 15,
padding: 20,
marginRight: 15,
minWidth: 120,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 5,
elevation: 3,
},
goalIcon: {
width: 50,
height: 50,
borderRadius: 12,
justifyContent: 'center',
alignItems: 'center',
marginBottom: 10,
},
goalValue: {
fontSize: 24,
fontWeight: 'bold',
color: '#1e293b',
},
goalLabel: {
fontSize: 14,
color: '#64748b',
marginTop: 2,
},
goalTarget: {
fontSize: 12,
color: '#94a3b8',
marginTop: 4,
},
categoryContainer: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: 10,
},
categoryPill: {
backgroundColor: 'white',
paddingHorizontal: 20,
paddingVertical: 10,
borderRadius: 20,
borderWidth: 1,
borderColor: '#e2e8f0',
},
activeCategoryPill: {
backgroundColor: '#2563eb',
borderColor: '#2563eb',
},
categoryText: {
color: '#64748b',
fontSize: 14,
fontWeight: '500',
},
activeCategoryText: {
color: 'white',
},
workoutCard: {
backgroundColor: 'white',
borderRadius: 15,
padding: 20,
marginBottom: 15,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 5,
elevation: 3,
},
workoutHeader: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 15,
},
workoutIcon: {
width: 60,
height: 60,
borderRadius: 15,
justifyContent: 'center',
alignItems: 'center',
marginRight: 15,
},
workoutEmoji: {
fontSize: 28,
},
workoutInfo: {
flex: 1,
},
workoutTitle: {
fontSize: 18,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 5,
},
workoutDescription: {
fontSize: 14,
color: '#64748b',
lineHeight: 20,
},
workoutFooter: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
workoutDuration: {
flexDirection: 'row',
alignItems: 'center',
},
durationText: {
marginLeft: 5,
color: '#64748b',
fontSize: 14,
},
startButton: {
backgroundColor: '#2563eb',
flexDirection: 'row',
alignItems: 'center',
paddingHorizontal: 20,
paddingVertical: 10,
borderRadius: 10,
},
startButtonText: {
color: 'white',
fontWeight: '600',
marginRight: 5,
},
tipsContainer: {
backgroundColor: '#FFF7ED',
borderRadius: 15,
padding: 20,
marginBottom: 30,
},
tipsTitle: {
fontSize: 16,
fontWeight: 'bold',
color: '#EA580C',
marginBottom: 8,
},
tipText: {
fontSize: 14,
color: '#9A3412',
lineHeight: 22,
},
modalContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
backgroundColor: 'rgba(0,0,0,0.5)',
padding: 20,
},
modalContent: {
backgroundColor: 'white',
borderRadius: 20,
padding: 25,
width: '100%',
maxWidth: 400,
},
modalHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 20,
},
modalTitle: {
fontSize: 24,
fontWeight: 'bold',
color: '#1e293b',
},
inputGroup: {
marginBottom: 20,
},
inputLabel: {
fontSize: 16,
fontWeight: '600',
color: '#475569',
marginBottom: 8,
},
input: {
backgroundColor: '#f8fafc',
borderWidth: 1,
borderColor: '#e2e8f0',
borderRadius: 12,
paddingHorizontal: 16,
paddingVertical: 14,
fontSize: 16,
color: '#1e293b',
},
calculateButton: {
backgroundColor: '#2563eb',
borderRadius: 12,
paddingVertical: 16,
alignItems: 'center',
marginTop: 10,
},
calculateButtonText: {
color: 'white',
fontSize: 16,
fontWeight: 'bold',
},
resultContainer: {
marginTop: 25,
paddingTop: 20,
borderTopWidth: 1,
borderTopColor: '#e2e8f0',
},
resultTitle: {
fontSize: 18,
fontWeight: 'bold',
color: '#1e293b',
marginBottom: 15,
},
bmiResultContainer: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 10,
},
bmiResultValue: {
fontSize: 36,
fontWeight: 'bold',
},
bmiCategoryBadge: {
paddingHorizontal: 15,
paddingVertical: 8,
borderRadius: 20,
},
bmiCategoryText: {
fontSize: 14,
fontWeight: '600',
},
bmiInfo: {
fontSize: 14,
color: '#64748b',
lineHeight: 22,
},
});    



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
const res = await fetch("http://localhost:5000/api/auth/login", {
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
<Text style={styles
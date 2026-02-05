// pages/DashboardScreen.js (Complete with Gemini AI Chatbot)
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { useWorkout } from "../context/WorkoutContext";
import { useGemini } from "../context/GeminiContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation }) {
  const { setIsLoggedIn } = useContext(AuthContext);
  const { startWorkout, getWorkoutProgress, workoutStats, getTodayWorkouts } = useWorkout();
  const { messages, loading, sendMessage, loadConversation } = useGemini();
  const [user, setUser] = useState(null);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatExpanded, setChatExpanded] = useState(false);
  const [showChat, setShowChat] = useState(true);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const chatHeight = useState(new Animated.Value(250))[0];
  const flatListRef = useRef(null);

  const workouts = [
    { 
      id: 1, 
      title: "Full Body Burn", 
      description: "Build Strength & Endurance", 
      duration: "30 min", 
      icon: "🏋️", 
      color: "#FF6B6B", 
      videoId: "full-body-burn",
      difficulty: "Beginner",
      calories: 280,
      exercises: 8,
      exercisesList: [
        { name: "Jumping Jacks", duration: 60, type: "warmup" },
        { name: "Push-ups", sets: 3, reps: 12, type: "strength" },
        { name: "Squats", sets: 3, reps: 15, type: "strength" },
        { name: "Plank", duration: 60, type: "core" },
        { name: "Lunges", sets: 3, reps: 12, type: "legs" },
        { name: "Arm Circles", duration: 45, type: "cardio" },
        { name: "Mountain Climbers", sets: 3, reps: 10, type: "fullbody" },
        { name: "Cool Down Stretch", duration: 120, type: "cooldown" }
      ]
    },
    { 
      id: 2, 
      title: "Cardio Blast", 
      description: "High Intensity Fat Burning", 
      duration: "45 min", 
      icon: "🏃", 
      color: "#4ECDC4", 
      videoId: "cardio-blast",
      difficulty: "Intermediate",
      calories: 450,
      exercises: 6,
      exercisesList: [
        { name: "Jumping Jacks", duration: 60, type: "warmup" },
        { name: "Running in Place", duration: 300, type: "cardio" },
        { name: "Jump Squats", sets: 4, reps: 15, type: "cardio" },
        { name: "Mountain Climbers", sets: 3, reps: 10, type: "cardio" },
        { name: "Plank", duration: 45, type: "core" },
        { name: "Stretching", duration: 180, type: "cooldown" }
      ]
    },
    { 
      id: 3, 
      title: "Yoga Flow", 
      description: "Flexibility & Stress Relief", 
      duration: "25 min", 
      icon: "🧘", 
      color: "#95E1D3", 
      videoId: "yoga-flow",
      difficulty: "Beginner",
      calories: 180,
      exercises: 12,
      exercisesList: [
        { name: "Child's Pose (Balasana)", duration: 60, type: "warmup" },
        { name: "Sun Salutation (Surya Namaskar)", duration: 45, type: "flow" },
        { name: "Warrior I", duration: 30, type: "standing" },
        { name: "Warrior II", duration: 30, type: "standing" },
        { name: "Tree Pose  (Vrikshasana)", duration: 45, type: "balance" },
        { name: "Bridge Pose", duration: 45, type: "backbend" },
        { name: "Cobra Pose", duration: 30, type: "backbend" },
        { name: "Seated Forward Fold", duration: 60, type: "stretch" },
        { name: "Butterfly Pose", duration: 45, type: "hip" },
        { name: "Corpse Pose", duration: 120, type: "relaxation" }
      ]
    },
    { 
      id: 4, 
      title: "Strength Power", 
      description: "Muscle Building Session", 
      duration: "40 min", 
      icon: "💪", 
      color: "#FFD166", 
      videoId: "strength-power",
      difficulty: "Advanced",
      calories: 320,
      exercises: 7,
      exercisesList: [
        { name: "Dynamic Stretching", duration: 120, type: "warmup" },
        { name: "Barbell Squats", sets: 4, reps: 8, type: "compound" },
        { name: "Bench Press", sets: 4, reps: 8, type: "compound" },
        { name: "Deadlifts", sets: 3, reps: 6, type: "compound" },
        { name: "Pull-ups", sets: 3, reps: "Failure", type: "strength" },
        { name: "Military Press", sets: 3, reps: 10, type: "strength" },
        { name: "Cool Down", duration: 120, type: "cooldown" }
      ]
    }
  ];

  useEffect(() => {
    loadUserData();
    loadTodayWorkouts();
    loadConversation();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadTodayWorkouts();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  };

  const loadTodayWorkouts = () => {
    const today = getTodayWorkouts();
    setTodayWorkouts(today);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    loadTodayWorkouts();
    loadConversation();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = parseFloat(height) / 100;
      const bmiValue = parseFloat(weight) / (heightInMeters * heightInMeters);
      setBmi(bmiValue.toFixed(1));

      if (bmiValue < 18.5) setBmiCategory("Underweight");
      else if (bmiValue < 25) setBmiCategory("Normal");
      else if (bmiValue < 30) setBmiCategory("Overweight");
      else setBmiCategory("Obese");
      
      setTimeout(() => setBmiModalVisible(false), 1500);
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

  const getBmiAdvice = () => {
    if (!bmiCategory) return '';
    switch(bmiCategory) {
      case 'Underweight': return 'Consider consulting a nutritionist';
      case 'Normal': return 'Great! Maintain your healthy lifestyle';
      case 'Overweight': return 'Try incorporating more cardio exercises';
      case 'Obese': return 'Recommended to consult with a healthcare provider';
      default: return '';
    }
  };

  const handleStartWorkout = (workout) => {
    startWorkout(workout);
    navigation.navigate('ActiveWorkout', { workout });
  };

  const getWorkoutCompletion = (workoutId) => {
    return getWorkoutProgress(workoutId);
  };

  // Handle chat input
  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Toggle chat expansion
  const toggleChatExpansion = () => {
    Animated.timing(chatHeight, {
      toValue: chatExpanded ? 250 : 400,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setChatExpanded(!chatExpanded);
  };

  // Quick questions for fitness advice
  const quickQuestions = [
    "Best workout for beginners?",
    "How to lose weight?",
    "Healthy diet tips",
    "Motivation for exercise"
  ];

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Loading your fitness journey...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Enhanced Header */}
      <LinearGradient 
        colors={['#7C3AED', '#5B21B6']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user.name.split(' ')[0]} 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications" size={24} color="white" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.iconButton}>
              <Icon name="power-settings-new" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.motivation}>Every rep brings you closer to your goal 💪</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
      >
        {/* BMI Card */}
        <TouchableOpacity 
          style={styles.bmiCard} 
          onPress={() => setBmiModalVisible(true)}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={['#8B5CF6', '#7C3AED']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bmiGradient}
          >
            <View style={styles.bmiContent}>
              <View style={styles.bmiTextContainer}>
                <Text style={styles.bmiTitle}>Body Health Check</Text>
                <Text style={styles.bmiSubtitle}>Track your BMI and wellness</Text>
                {bmi && (
                  <View style={styles.bmiAdviceContainer}>
                    <Text style={styles.bmiAdvice}>{getBmiAdvice()}</Text>
                  </View>
                )}
              </View>
              {bmi ? (
                <View style={styles.bmiResult}>
                  <View style={styles.bmiCircle}>
                    <Text style={[styles.bmiValue, { color: getBmiColor() }]}>{bmi}</Text>
                    <Text style={styles.bmiLabel}>BMI</Text>
                  </View>
                  <Text style={[styles.bmiCategory, { color: getBmiColor() }]}>{bmiCategory}</Text>
                </View>
              ) : (
                <View style={styles.bmiIconContainer}>
                  <Icon name="calculate" size={48} color="white" />
                  <Text style={styles.calculateText}>Calculate Now</Text>
                </View>
              )}
            </View>
            <Icon name="chevron-right" size={24} color="white" style={styles.chevronIcon} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayWorkouts.length}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workoutStats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workoutStats.totalMinutes}</Text>
              <Text style={styles.statLabel}>Total Min</Text>
            </View>
          </View>
        </View>

        {/* Gemini AI Chatbot Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fitness AI Assistant</Text>
            <TouchableOpacity onPress={() => setShowChat(!showChat)}>
              <Icon 
                name={showChat ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#7C3AED" 
              />
            </TouchableOpacity>
          </View>
          
          {showChat && (
            <Animated.View style={[styles.chatContainer, { height: chatHeight }]}>
              <LinearGradient
                colors={['#F8FAFC', '#F1F5F9']}
                style={styles.chatGradient}
              >
                {/* Chat Header */}
                <View style={styles.chatHeader}>
                  <View style={styles.chatTitleContainer}>
                    <View style={styles.aiIcon}>
                      <Icon name="smart-toy" size={20} color="#7C3AED" />
                    </View>
                    <Text style={styles.chatTitle}>Gemini AI Assistant</Text>
                  </View>
                  <TouchableOpacity onPress={toggleChatExpansion}>
                    <Icon 
                      name={chatExpanded ? "fullscreen-exit" : "fullscreen"} 
                      size={20} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Messages Container */}
                <View style={styles.messagesContainer}>
                  {messages.length === 0 ? (
                    <View style={styles.welcomeContainer}>
                      <View style={styles.welcomeIcon}>
                        <Icon name="fitness-center" size={40} color="#7C3AED" />
                      </View>
                      <Text style={styles.welcomeTitle}>Fitness Assistant</Text>
                      <Text style={styles.welcomeText}>
                        Ask me anything about workouts, nutrition, or fitness tips!
                      </Text>
                      
                      {/* Quick Questions */}
                      <View style={styles.quickQuestionsContainer}>
                        <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
                        <View style={styles.quickQuestionsGrid}>
                          {quickQuestions.map((question, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.quickQuestion}
                              onPress={() => {
                                setChatInput(question);
                                handleSendMessage();
                              }}
                            >
                              <Text style={styles.quickQuestionText}>{question}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  ) : (
                    <FlatList
                      ref={flatListRef}
                      data={messages}
                      keyExtractor={(item, index) => index.toString()}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.messagesList}
                      renderItem={({ item }) => (
                        <View style={[
                          styles.messageBubble,
                          item.role === 'user' ? styles.userMessage : styles.aiMessage
                        ]}>
                          <View style={[
                            styles.messageAvatar,
                            item.role === 'user' ? styles.userAvatar : styles.aiAvatar
                          ]}>
                            <Icon 
                              name={item.role === 'user' ? 'person' : 'smart-toy'} 
                              size={16} 
                              color="white" 
                            />
                          </View>
                          <View style={styles.messageContent}>
                            <Text style={[
                              styles.messageText,
                              item.role === 'user' ? styles.userText : styles.aiText
                            ]}>
                              {item.content}
                            </Text>
                            <Text style={styles.messageTime}>
                              {new Date(item.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Text>
                          </View>
                        </View>
                      )}
                    />
                  )}
                </View>

                {/* Input Container */}
                <KeyboardAvoidingView 
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  style={styles.inputContainer}
                >
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Ask about fitness, workouts, or nutrition..."
                    placeholderTextColor="#94a3b8"
                    value={chatInput}
                    onChangeText={setChatInput}
                    multiline
                    onSubmitEditing={handleSendMessage}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity 
                    style={[
                      styles.sendButton,
                      (!chatInput.trim() || loading) && styles.sendButtonDisabled
                    ]}
                    onPress={handleSendMessage}
                    disabled={!chatInput.trim() || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Icon name="send" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        {/* Recommended Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Workouts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.workoutsScroll}
          >
            {workouts.map(workout => {
              const completionCount = getWorkoutCompletion(workout.id);
              
              return (
                <TouchableOpacity 
                  key={workout.id} 
                  style={[
                    styles.workoutCard,
                    { 
                      backgroundColor: workout.color,
                      width: width * 0.8,
                      marginRight: 16
                    }
                  ]}
                  activeOpacity={0.9}
                  onPress={() => handleStartWorkout(workout)}
                >
                  <LinearGradient
                    colors={[workout.color, `${workout.color}DD`]}
                    style={styles.workoutGradient}
                  >
                    <View style={styles.workoutHeader}>
                      <View style={styles.workoutIcon}>
                        <Text style={styles.workoutEmoji}>{workout.icon}</Text>
                      </View>
                      <View style={styles.workoutTags}>
                        <View style={styles.difficultyBadge}>
                          <Text style={styles.difficultyText}>{workout.difficulty}</Text>
                        </View>
                        {completionCount > 0 && (
                          <View style={styles.completionBadge}>
                            <Icon name="check-circle" size={12} color="white" />
                            <Text style={styles.completionText}>{completionCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutTitle}>{workout.title}</Text>
                      <Text style={styles.workoutDescription}>{workout.description}</Text>
                      
                      <View style={styles.workoutStats}>
                        <View style={styles.workoutStat}>
                          <Icon name="schedule" size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.workoutStatText}>{workout.duration}</Text>
                        </View>
                        <View style={styles.workoutStat}>
                          <Icon name="fitness-center" size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.workoutStatText}>{workout.exercises} ex</Text>
                        </View>
                        <View style={styles.workoutStat}>
                          <Icon name="local-fire-department" size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.workoutStatText}>{workout.calories} cal</Text>
                        </View>
                      </View>
                      
                      <View style={styles.workoutFooter}>
                        <TouchableOpacity 
                          style={styles.startButton}
                          onPress={() => handleStartWorkout(workout)}
                        >
                          <Text style={styles.startButtonText}>Start Workout</Text>
                          <Icon name="play-arrow" size={18} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Recent Activity */}
        {todayWorkouts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContainer}>
              {todayWorkouts.slice(0, 3).map((workout, index) => (
                <TouchableOpacity key={index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: workout.color }]}>
                    <Text style={styles.activityEmoji}>{workout.icon}</Text>
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{workout.title}</Text>
                    <Text style={styles.activityTime}>
                      {workout.duration} • {workout.calories} calories burned
                    </Text>
                  </View>
                  <Text style={styles.activityTimeAgo}>
                    {new Date(workout.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* BMI Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={bmiModalVisible} 
        onRequestClose={() => setBmiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>BMI Calculator</Text>
                <TouchableOpacity 
                  onPress={() => setBmiModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <View style={styles.modalContent}>
              {bmi ? (
                <View style={styles.bmiResultModal}>
                  <View style={styles.resultCircle}>
                    <Text style={[styles.resultValue, { color: getBmiColor() }]}>{bmi}</Text>
                    <Text style={styles.resultLabel}>Your BMI</Text>
                  </View>
                  <View style={styles.resultCategory}>
                    <Text style={[styles.categoryText, { color: getBmiColor() }]}>
                      {bmiCategory}
                    </Text>
                    <Text style={styles.categoryAdvice}>{getBmiAdvice()}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.recalculateButton}
                    onPress={() => setBmi(null)}
                  >
                    <Text style={styles.recalculateText}>Calculate Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelContainer}>
                      <Icon name="monitor-weight" size={20} color="#7C3AED" />
                      <Text style={styles.inputLabel}>Weight (kg)</Text>
                    </View>
                    <TextInput 
                      style={styles.input}
                      keyboardType="numeric"
                      value={weight}
                      onChangeText={setWeight}
                      placeholder="Enter your weight"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <View style={styles.inputLabelContainer}>
                      <Icon name="straighten" size={20} color="#7C3AED" />
                      <Text style={styles.inputLabel}>Height (cm)</Text>
                    </View>
                    <TextInput 
                      style={styles.input}
                      keyboardType="numeric"
                      value={height}
                      onChangeText={setHeight}
                      placeholder="Enter your height"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.calculateButton,
                      (!weight || !height) && styles.calculateButtonDisabled
                    ]}
                    onPress={calculateBMI}
                    disabled={!weight || !height}
                  >
                    <LinearGradient
                      colors={['#7C3AED', '#5B21B6']}
                      style={styles.calculateGradient}
                    >
                      <Icon name="calculate" size={24} color="white" />
                      <Text style={styles.calculateButtonText}>Calculate BMI</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500'
  },
  
  // Header Styles
  header: { 
    paddingTop: 60, 
    paddingBottom: 30, 
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  greeting: { 
    color: 'rgba(255,255,255,0.9)', 
    fontSize: 14, 
    fontWeight: '500',
    letterSpacing: 0.5
  },
  userName: { 
    color: 'white', 
    fontSize: 32, 
    fontWeight: 'bold',
    marginTop: 4
  },
  headerIcons: { 
    flexDirection: 'row', 
    gap: 12 
  },
  iconButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#7C3AED'
  },
  motivation: { 
    color: 'rgba(255,255,255,0.95)', 
    fontSize: 16, 
    fontWeight: '500', 
    textAlign: 'center',
    marginTop: 8
  },
  
  // Content Styles
  content: { 
    flex: 1, 
    padding: 24 
  },
  
  // BMI Card Styles
  bmiCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 28,
    elevation: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  bmiGradient: { 
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bmiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  bmiTextContainer: {
    flex: 1
  },
  bmiTitle: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: 'bold',
    marginBottom: 4
  },
  bmiSubtitle: { 
    color: 'rgba(255,255,255,0.85)', 
    fontSize: 14, 
    marginBottom: 8
  },
  bmiAdviceContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8
  },
  bmiAdvice: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  },
  bmiResult: {
    alignItems: 'center',
    marginLeft: 16
  },
  bmiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  bmiValue: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  bmiLabel: {
    color: 'white',
    fontSize: 12,
    opacity: 0.9
  },
  bmiCategory: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600',
    marginTop: 4
  },
  bmiIconContainer: {
    alignItems: 'center',
    marginLeft: 16
  },
  calculateText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500'
  },
  chevronIcon: {
    marginLeft: 12
  },
  
  // Section Styles
  section: { 
    marginBottom: 32
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#1F2937',
    letterSpacing: -0.5
  },
  viewAll: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600'
  },
  
  // Stats Container
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7C3AED'
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500'
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#F3F4F6',
    alignSelf: 'center'
  },
  
  // Chatbot Styles
  chatContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  chatGradient: {
    flex: 1,
    padding: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chatTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  messagesContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messagesList: {
    paddingVertical: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '90%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  userAvatar: {
    backgroundColor: '#7C3AED',
  },
  aiAvatar: {
    backgroundColor: '#10B981',
  },
  messageContent: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  userText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: '#1F2937',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'right',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  quickQuestionsContainer: {
    width: '100%',
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickQuestion: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickQuestionText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  chatInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 80,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  
  // Workouts
  workoutsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  workoutCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  workoutGradient: {
    padding: 24,
    height: 290
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    
  },
  workoutIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  workoutEmoji: {
    fontSize: 32
  },
  workoutTags: {
    flexDirection: 'row',
    gap: 8
  },
  difficultyBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  completionBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4
  },
  completionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  workoutInfo: {
    flex: 1,
    justifyContent: 'space-between'
  },
  workoutTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8
  },
  workoutDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  workoutStatText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500'
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    gap: 8
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Activity Container
  activityContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  activityEmoji: {
    fontSize: 24
  },
  activityInfo: {
    flex: 1
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280'
  },
  activityTimeAgo: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 32,
    overflow: 'hidden',
    maxHeight: '80%'
  },
  modalHeaderGradient: {
    padding: 24
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    padding: 32
  },
  bmiResultModal: {
    alignItems: 'center'
  },
  resultCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32
  },
  resultValue: {
    fontSize: 48,
    fontWeight: 'bold'
  },
  resultLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8
  },
  resultCategory: {
    alignItems: 'center',
    marginBottom: 32
  },
  categoryText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12
  },
  categoryAdvice: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24
  },
  recalculateButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16
  },
  recalculateText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 24
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500'
  },
  calculateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16
  },
  calculateButtonDisabled: {
    opacity: 0.5
  },
  calculateGradient: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12
  }
});
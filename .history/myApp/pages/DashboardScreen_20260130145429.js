// pages/DashboardScreen.js
import React, { useEffect, useState, useContext } from "react";
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
  RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation }) {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    steps: { current: 7580, goal: 10000 },
    calories: { current: 1250, goal: 2500 },
    workouts: { current: 3, goal: 5 },
    water: { current: 2.1, goal: 3.5 }
  });

  const fadeAnim = useState(new Animated.Value(0))[0];

  const workouts = [
    { id: 1, title: "Full Body Burn", description: "Build Strength & Endurance", duration: "30 min", icon: "🏋️", color: "#FF6B6B", progress: 0 },
    { id: 2, title: "Cardio Blast", description: "High Intensity Fat Burning", duration: "45 min", icon: "🏃", color: "#4ECDC4", progress: 100 },
    { id: 3, title: "Yoga Flow", description: "Flexibility & Stress Relief", duration: "25 min", icon: "🧘", color: "#95E1D3", progress: 50 },
    { id: 4, title: "Strength Power", description: "Muscle Building Session", duration: "40 min", icon: "💪", color: "#FFD166", progress: 75 }
  ];

  useEffect(() => {
    loadUserData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
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

  const calculateProgress = (current, goal) => {
    return Math.min((current / goal) * 100, 100);
  };

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
        {/* BMI Card - Enhanced */}
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

        {/* Today's Goals - Enhanced with Progress Bars */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Progress</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.goalsGrid}>
            {Object.entries(stats).map(([key, value]) => {
              const progress = calculateProgress(value.current, value.goal);
              return (
                <View key={key} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIconContainer, { backgroundColor: `${getBmiColor()}20` }]}>
                      <Icon 
                        name={
                          key === 'steps' ? 'directions-walk' :
                          key === 'calories' ? 'local-fire-department' :
                          key === 'workouts' ? 'fitness-center' :
                          'local-drink'
                        } 
                        size={24} 
                        color={getBmiColor()} 
                      />
                    </View>
                    <Text style={styles.goalLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${progress}%`,
                            backgroundColor: getBmiColor()
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                  </View>
                  <Text style={styles.goalValue}>
                    {value.current.toLocaleString()} / {value.goal.toLocaleString()}
                    {key === 'water' && 'L'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Workouts - Enhanced */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Workouts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>See More</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.workoutsScroll}
          >
            {workouts.map(workout => (
              <TouchableOpacity 
                key={workout.id} 
                style={[
                  styles.workoutCard,
                  { 
                    backgroundColor: workout.color,
                    width: width * 0.75,
                    marginRight: 16
                  }
                ]}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[workout.color, `${workout.color}DD`]}
                  style={styles.workoutGradient}
                >
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutIcon}>
                      <Text style={styles.workoutEmoji}>{workout.icon}</Text>
                    </View>
                    <View style={styles.workoutProgress}>
                      <View style={styles.progressCircle}>
                        <Text style={styles.progressPercentage}>{workout.progress}%</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutTitle}>{workout.title}</Text>
                    <Text style={styles.workoutDescription}>{workout.description}</Text>
                    <View style={styles.workoutFooter}>
                      <View style={styles.durationBadge}>
                        <Icon name="access-time" size={14} color="white" />
                        <Text style={styles.durationText}>{workout.duration}</Text>
                      </View>
                      <TouchableOpacity style={styles.startButton}>
                        <Text style={styles.startButtonText}>Start</Text>
                        <Icon name="play-arrow" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12.5K</Text>
              <Text style={styles.statLabel}>Avg Steps</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.2</Text>
              <Text style={styles.statLabel}>Avg Workouts</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced BMI Modal */}
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
    marginBottom: 39 ,
    
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
  
  // Goals Grid
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  goalLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  goalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  
  // Workouts
  workoutsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    marginBottom:
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
    height: 220
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
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
  workoutProgress: {
    alignItems: 'center'
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressPercentage: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
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
    marginBottom: 20
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16
  },
  startButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6
  },
  
  // Stats
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
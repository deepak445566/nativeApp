// pages/WorkoutSummaryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
  Animated,
  Image
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function WorkoutSummaryScreen({ route, navigation }) {
  const { workout, duration, calories, exercisesCompleted } = route.params;
  const [user, setUser] = useState(null);
  const [achievement, setAchievement] = useState(null);
  const [streak, setStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadUserData();
    calculateAchievement();
    loadStats();
    playCelebration();
    saveWorkoutHistory();
  }, []);

  const playCelebration = () => {
   
    
    // Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  const loadUserData = async () => {
    const data = await AsyncStorage.getItem("user");
    if (data) setUser(JSON.parse(data));
  };

  const loadStats = async () => {
    try {
      const stats = await AsyncStorage.getItem("workout_stats");
      if (stats) {
        const parsedStats = JSON.parse(stats);
        setStreak(parsedStats.streak || 0);
        setTotalWorkouts(parsedStats.totalWorkouts || 0);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const calculateAchievement = () => {
    let newAchievement = {
      title: "Great Start!",
      icon: "🌟",
      description: "You completed your workout!",
      color: "#7C3AED"
    };

    if (duration > 1800) {
      newAchievement = {
        title: "Marathon Runner",
        icon: "🏃‍♂️",
        description: "Over 30 minutes of intense training!",
        color: "#3B82F6"
      };
    } else if (calories > 300) {
      newAchievement = {
        title: "Calorie Burner",
        icon: "🔥",
        description: "Burned more than 300 calories!",
        color: "#EF4444"
      };
    } else if (exercisesCompleted > 8) {
      newAchievement = {
        title: "Exercise Master",
        icon: "💪",
        description: "Completed 8+ exercises with perfection!",
        color: "#10B981"
      };
    } else if (duration > 1200) {
      newAchievement = {
        title: "Endurance King",
        icon: "👑",
        description: "20+ minutes of non-stop workout!",
        color: "#F59E0B"
      };
    }

    setAchievement(newAchievement);
  };

  const saveWorkoutHistory = async () => {
    try {
      const workoutHistory = {
        id: Date.now(),
        workoutId: workout.id,
        title: workout.title,
        date: new Date().toISOString(),
        duration,
        calories,
        exercisesCompleted,
        achievement: achievement?.title
      };

      // Get existing history
      const existingHistory = await AsyncStorage.getItem("workout_history");
      let history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Add new workout
      history.unshift(workoutHistory);
      
      // Keep only last 50 workouts
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      await AsyncStorage.setItem("workout_history", JSON.stringify(history));
      
      // Update stats
      const stats = await AsyncStorage.getItem("workout_stats");
      let statsData = stats ? JSON.parse(stats) : {
        totalWorkouts: 0,
        totalMinutes: 0,
        totalCalories: 0,
        streak: 0,
        lastWorkoutDate: null
      };
      
      const today = new Date().toDateString();
      const lastWorkoutDate = statsData.lastWorkoutDate ? new Date(statsData.lastWorkoutDate).toDateString() : null;
      
      // Update streak
      if (lastWorkoutDate === today) {
        // Already worked out today, don't increase streak
      } else if (lastWorkoutDate && 
                 (new Date(today) - new Date(lastWorkoutDate)) / (1000 * 60 * 60 * 24) === 1) {
        statsData.streak += 1;
      } else {
        statsData.streak = 1;
      }
      
      statsData.totalWorkouts += 1;
      statsData.totalMinutes += Math.floor(duration / 60);
      statsData.totalCalories += calories;
      statsData.lastWorkoutDate = new Date().toISOString();
      
      await AsyncStorage.setItem("workout_stats", JSON.stringify(statsData));
      setStreak(statsData.streak);
      setTotalWorkouts(statsData.totalWorkouts);
      
    } catch (error) {
      console.error("Error saving workout history:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const shareResults = async () => {
    try {
      const shareMessage = `🏋️ I just completed "${workout.title}"!
⏱️ Duration: ${formatTime(duration)}
🔥 Calories: ${calories} cal
✅ Exercises: ${exercisesCompleted} completed
${achievement?.icon} Achievement: ${achievement?.title}

#FitnessApp #WorkoutComplete`;
      
      await Share.share({
        message: shareMessage,
        title: 'My Workout Results'
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleRateWorkout = () => {
    Alert.prompt(
      "Rate this Workout",
      "How would you rate this workout? (1-5)",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: (rating) => {
            if (rating && rating >= 1 && rating <= 5) {
              saveRating(parseInt(rating));
              Alert.alert("Thank You!", "Your rating has been saved.");
            }
          }
        }
      ],
      'plain-text',
      '5'
    );
  };

  const saveRating = async (rating) => {
    try {
      const ratings = await AsyncStorage.getItem("workout_ratings");
      let ratingsData = ratings ? JSON.parse(ratings) : {};
      
      if (!ratingsData[workout.id]) {
        ratingsData[workout.id] = [];
      }
      
      ratingsData[workout.id].push({
        rating,
        date: new Date().toISOString()
      });
      
      await AsyncStorage.setItem("workout_ratings", JSON.stringify(ratingsData));
    } catch (error) {
      console.error("Error saving rating:", error);
    }
  };

  const getWorkoutIntensity = () => {
    if (duration > 1800) return "High";
    if (duration > 1200) return "Medium";
    return "Low";
  };

  const getNextWorkoutSuggestion = () => {
    const suggestions = [
      {
        title: "Recovery Yoga",
        description: "Light stretching for muscle recovery",
        duration: "20 min",
        icon: "🧘"
      },
      {
        title: "Cardio Blast",
        description: "Boost your heart rate",
        duration: "30 min",
        icon: "🏃"
      },
      {
        title: "Core Strength",
        description: "Build strong abs",
        duration: "15 min",
        icon: "🔥"
      }
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const nextWorkout = getNextWorkoutSuggestion();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Summary</Text>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={shareResults}
          >
            <Icon name="share" size={24} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Celebration Animation */}
        <Animated.View 
          style={[
            styles.celebrationContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[achievement?.color || '#7C3AED', `${achievement?.color || '#7C3AED'}DD`]}
            style={styles.celebrationCard}
          >
            <View style={styles.celebrationContent}>
              <Text style={styles.celebrationEmoji}>{achievement?.icon || '🎉'}</Text>
              <Text style={styles.celebrationTitle}>Workout Complete!</Text>
              <Text style={styles.celebrationSubtitle}>You crushed it!</Text>
              
              <View style={styles.achievementBadge}>
                <Icon name="emoji-events" size={20} color="white" />
                <Text style={styles.achievementText}>{achievement?.title || 'Great Job!'}</Text>
              </View>
              
              <Text style={styles.achievementDescription}>
                {achievement?.description || 'Keep up the great work!'}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* User Greeting */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingContent}>
            <Text style={styles.greetingText}>
              Amazing work{user ? `, ${user.name.split(' ')[0]}` : ''}! 👏
            </Text>
            <Text style={styles.greetingSubtext}>
              Your dedication is paying off!
            </Text>
          </View>
          <View style={styles.streakContainer}>
            <Icon name="whatshot" size={20} color="#F59E0B" />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        </View>

        {/* Main Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Performance Summary</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#7C3AED20', '#7C3AED10']}
                style={styles.statIconContainer}
              >
                <Icon name="access-time" size={32} color="#7C3AED" />
              </LinearGradient>
              <Text style={styles.statValue}>{formatTime(duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statSubLabel}>{getWorkoutIntensity()} Intensity</Text>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#EF444420', '#EF444410']}
                style={styles.statIconContainer}
              >
                <Icon name="local-fire-department" size={32} color="#EF4444" />
              </LinearGradient>
              <Text style={styles.statValue}>{calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statSubLabel}>Burned</Text>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#10B98120', '#10B98110']}
                style={styles.statIconContainer}
              >
                <Icon name="fitness-center" size={32} color="#10B981" />
              </LinearGradient>
              <Text style={styles.statValue}>{exercisesCompleted}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
              <Text style={styles.statSubLabel}>Completed</Text>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={['#3B82F620', '#3B82F610']}
                style={styles.statIconContainer}
              >
                <Icon name="trending-up" size={32} color="#3B82F6" />
              </LinearGradient>
              <Text style={styles.statValue}>
                {Math.round((exercisesCompleted / workout.exercises) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Completion</Text>
              <Text style={styles.statSubLabel}>Rate</Text>
            </View>
          </View>
        </View>

        {/* Workout Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Workout Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="sports" size={20} color="#64748B" />
              <Text style={styles.detailLabel}>Workout</Text>
              <Text style={styles.detailValue}>{workout.title}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="speed" size={20} color="#64748B" />
              <Text style={styles.detailLabel}>Difficulty</Text>
              <Text style={[
                styles.detailValue,
                workout.difficulty === 'Beginner' && { color: '#10B981' },
                workout.difficulty === 'Intermediate' && { color: '#F59E0B' },
                workout.difficulty === 'Advanced' && { color: '#EF4444' }
              ]}>
                {workout.difficulty}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="category" size={20} color="#64748B" />
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {workout.exercisesList[0]?.type || 'Full Body'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={20} color="#64748B" />
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color="#64748B" />
              <Text style={styles.detailLabel}>Time of Day</Text>
              <Text style={styles.detailValue}>
                {new Date().toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Icon name="assessment" size={20} color="#64748B" />
              <Text style={styles.detailLabel}>Total Workouts</Text>
              <Text style={styles.detailValue}>{totalWorkouts}</Text>
            </View>
          </View>
        </View>

        {/* Progress Summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          
          <View style={styles.progressItem}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Exercise Completion</Text>
              <Text style={styles.progressValue}>
                {exercisesCompleted} / {workout.exercises} exercises
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(exercisesCompleted / workout.exercises) * 100}%`,
                    backgroundColor: '#7C3AED'
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.progressItem}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Time vs Goal</Text>
              <Text style={styles.progressValue}>
                {formatTime(duration)} / {workout.duration} goal
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min((duration / (parseInt(workout.duration) * 60)) * 100, 100)}%`,
                    backgroundColor: '#10B981'
                  }
                ]} 
              />
            </View>
          </View>
          
          <View style={styles.progressItem}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Calorie Target</Text>
              <Text style={styles.progressValue}>
                {calories} / {workout.calories} cal
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min((calories / workout.calories) * 100, 100)}%`,
                    backgroundColor: '#EF4444'
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Next Steps</Text>
          
          <TouchableOpacity 
            style={styles.nextStepButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.nextStepIcon}
            >
              <Icon name="home" size={24} color="white" />
            </LinearGradient>
            <View style={styles.nextStepInfo}>
              <Text style={styles.nextStepTitle}>Back to Dashboard</Text>
              <Text style={styles.nextStepDescription}>View your progress and stats</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextStepButton}
            onPress={() => navigation.navigate('ActiveWorkout', { workout })}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.nextStepIcon}
            >
              <Icon name="replay" size={24} color="white" />
            </LinearGradient>
            <View style={styles.nextStepInfo}>
              <Text style={styles.nextStepTitle}>Repeat Workout</Text>
              <Text style={styles.nextStepDescription}>Do this workout again</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextStepButton}
            onPress={handleRateWorkout}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.nextStepIcon}
            >
              <Icon name="star" size={24} color="white" />
            </LinearGradient>
            <View style={styles.nextStepInfo}>
              <Text style={styles.nextStepTitle}>Rate Workout</Text>
              <Text style={styles.nextStepDescription}>Share your feedback</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Next Workout Suggestion */}
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>Suggested Next Workout</Text>
          
          <TouchableOpacity 
            style={styles.suggestionButton}
            onPress={() => {
              // Navigate to suggested workout
              Alert.alert(
                "Coming Soon",
                "This feature will be available in the next update!"
              );
            }}
          >
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionEmoji}>{nextWorkout.icon}</Text>
              <View style={styles.suggestionInfo}>
                <Text style={styles.suggestionWorkout}>{nextWorkout.title}</Text>
                <Text style={styles.suggestionDesc}>{nextWorkout.description}</Text>
              </View>
              <View style={styles.suggestionBadge}>
                <Text style={styles.suggestionDuration}>{nextWorkout.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={shareResults}
          >
            <Icon name="share" size={20} color="#7C3AED" />
            <Text style={styles.secondaryButtonText}>Share Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
            <Icon name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Celebration Message */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            "The only bad workout is the one that didn't happen." 
          </Text>
          <Text style={styles.footerSubtext}>- Keep Going! 💪</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  celebrationCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginBottom: 20,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    gap: 8,
  },
  achievementText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  greetingCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  greetingContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  streakText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  progressItem: {
    marginBottom: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextStepsCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nextStepIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextStepInfo: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  nextStepDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  suggestionCard: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  suggestionButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    overflow: 'hidden',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  suggestionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionWorkout: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  suggestionDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  suggestionBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  suggestionDuration: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  secondaryButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
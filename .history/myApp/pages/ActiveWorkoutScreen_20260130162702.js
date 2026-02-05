// pages/ActiveWorkoutScreen.js (ENHANCED UI VERSION)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';
import VideoPlayer from '../components/VideoPlayer';

const { width, height } = Dimensions.get('window');

export default function ActiveWorkoutScreen({ route, navigation }) {
  const { workout } = route.params;
  const { completeWorkout } = useWorkout();
  
  const [currentExercise, setCurrentExercise] = useState(0);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const timerRef = useRef(null);
  const exerciseTimerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const exercises = workout.exercisesList || [];
  const currentExerciseData = exercises[currentExercise] || {};

  useEffect(() => {
    // Start workout timer
    startTimer();
    
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Calculate initial calories
    updateCalories();

    // Setup back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (exerciseTimerRef.current) {
        clearInterval(exerciseTimerRef.current);
      }
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    updateCalories();
  }, [workoutTime]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setWorkoutTime(prev => prev + 1);
      }
    }, 1000);
    
    startExerciseTimer();
  };

  const startExerciseTimer = () => {
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
    
    exerciseTimerRef.current = setInterval(() => {
      if (!isPaused && isVideoPlaying) {
        setExerciseTime(prev => prev + 1);
      }
    }, 1000);
  };

  const updateCalories = () => {
    // Simple calorie calculation: ~10 calories per minute
    const calories = Math.floor((workoutTime / 60) * 10);
    setCaloriesBurned(calories);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoComplete = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setExerciseTime(0);
    } else {
      completeWorkoutHandler();
    }
  };

  const completeWorkoutHandler = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
    
    const totalExercises = exercises.length;
    const exercisesCompleted = completedExercises.length + 1;
    
    // Call completeWorkout from context
    if (completeWorkout) {
      completeWorkout(workoutTime, caloriesBurned, exercisesCompleted);
    }
    
    navigation.navigate('WorkoutSummary', {
      workout,
      duration: workoutTime,
      calories: caloriesBurned,
      exercisesCompleted
    });
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setIsVideoPlaying(false);
    } else {
      setIsVideoPlaying(true);
      startExerciseTimer();
    }
  };

  const handleVideoPlayPause = (playing) => {
    setIsVideoPlaying(playing);
    if (playing) {
      setIsPaused(false);
      startExerciseTimer();
    }
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setExerciseTime(0);
    }
  };

  const handlePrevExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(prev => prev - 1);
      setExerciseTime(0);
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      "End Workout?",
      "Are you sure you want to end this workout? Your progress will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End", onPress: () => navigation.goBack() }
      ]
    );
    return true;
  };

  const getExerciseProgress = () => {
    if (!currentExerciseData.duration) return 0;
    return Math.min((exerciseTime / currentExerciseData.duration) * 100, 100);
  };

  const handleSkipExercise = () => {
    Alert.alert(
      "Skip Exercise?",
      `Are you sure you want to skip ${currentExerciseData.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Skip", 
          onPress: () => {
            if (currentExercise < exercises.length - 1) {
              handleNextExercise();
            } else {
              completeWorkoutHandler();
            }
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#7C3AED';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Timer */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {workout.title}
          </Text>
          <View style={styles.timerContainer}>
            <Icon name="access-time" size={16} color="#7C3AED" />
            <Text style={styles.timerText}>{formatTime(workoutTime)}</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.calorieBadge}>
            <Icon name="local-fire-department" size={16} color="#EF4444" />
            <Text style={styles.calorieText}>{caloriesBurned}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Video Player Section */}
        <View style={styles.videoSection}>
          <View style={styles.videoContainer}>
            <VideoPlayer
              onClose={() => navigation.goBack()}
              workoutDuration={workout.duration}
              onVideoComplete={handleVideoComplete}
              onTimeUpdate={(time) => setExerciseTime(Math.floor(time))}
              onPlayPause={handleVideoPlayPause}
              isPlaying={!isPaused}
            />
            <View style={styles.videoOverlay}>
              <View style={styles.difficultyBadge}>
                <Text style={[styles.difficultyText, { 
                  color: getDifficultyColor(currentExerciseData.difficulty) 
                }]}>
                  {currentExerciseData.difficulty || 'Moderate'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Animated.View style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {/* Exercise Info Card */}
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.exerciseInfoCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitleRow}>
                <Text style={styles.exerciseNumber}>
                  Exercise {currentExercise + 1} of {exercises.length}
                </Text>
                <View style={styles.heartRateContainer}>
                  <Icon name="favorite" size={16} color="#EF4444" />
                  <Text style={styles.heartRateText}>120-140 BPM</Text>
                </View>
              </View>
              <Text style={styles.exerciseName}>{currentExerciseData.name}</Text>
              <Text style={styles.exerciseDescription}>
                {currentExerciseData.description || 'Focus on form and breathing'}
              </Text>
            </View>
            
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                  <Icon name="fitness-center" size={20} color="#7C3AED" />
                </View>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={styles.statValue}>
                  {currentExerciseData.type?.charAt(0).toUpperCase() + currentExerciseData.type?.slice(1) || 'Exercise'}
                </Text>
              </View>
              
              {currentExerciseData.duration && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Icon name="timer" size={20} color="#EF4444" />
                  </View>
                  <Text style={styles.statLabel}>Duration</Text>
                  <Text style={styles.statValue}>
                    {formatTime(exerciseTime)} / {currentExerciseData.duration}s
                  </Text>
                </View>
              )}
              
              {currentExerciseData.sets && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Icon name="repeat" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.statLabel}>Sets</Text>
                  <Text style={styles.statValue}>{currentExerciseData.sets}</Text>
                </View>
              )}
              
              {currentExerciseData.reps && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Icon name="functions" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.statLabel}>Reps</Text>
                  <Text style={styles.statValue}>{currentExerciseData.reps}</Text>
                </View>
              )}
            </View>
            
            {/* Exercise Progress with Animation */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(getExerciseProgress())}%
                </Text>
              </View>
              <View style={styles.exerciseProgressBar}>
                <Animated.View 
                  style={[
                    styles.exerciseProgressFill,
                    { 
                      width: `${getExerciseProgress()}%`,
                      backgroundColor: getDifficultyColor(currentExerciseData.difficulty)
                    }
                  ]} 
                />
              </View>
            </View>
          </LinearGradient>

          {/* Main Controls */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[
                styles.controlButton,
                styles.prevButton,
                currentExercise === 0 && styles.disabledButton
              ]}
              onPress={handlePrevExercise}
              disabled={currentExercise === 0}
            >
              <Icon name="chevron-left" size={28} color={currentExercise === 0 ? "#64748B" : "white"} />
              <Text style={[
                styles.controlText,
                currentExercise === 0 && styles.disabledText
              ]}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.mainControl}
              onPress={handlePauseResume}
            >
              <LinearGradient
                colors={isPaused ? ['#10B981', '#059669'] : ['#7C3AED', '#6D28D9']}
                style={styles.mainControlGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Icon 
                  name={isPaused ? "play-arrow" : "pause"} 
                  size={36} 
                  color="white" 
                />
              </LinearGradient>
              <Text style={styles.mainControlText}>
                {isPaused ? "Resume" : "Pause"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.controlButton,
                styles.nextButton,
                currentExercise === exercises.length - 1 && styles.completeButton
              ]}
              onPress={currentExercise === exercises.length - 1 ? completeWorkoutHandler : handleNextExercise}
            >
              <Icon 
                name={currentExercise === exercises.length - 1 ? "check-circle" : "chevron-right"} 
                size={28} 
                color="white" 
              />
              <Text style={styles.controlText}>
                {currentExercise === exercises.length - 1 ? "Complete" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={handleSkipExercise}
            >
              <Icon name="skip-next" size={20} color="#94A3B8" />
              <Text style={styles.quickActionText}>Skip</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => Alert.alert('Instructions', currentExerciseData.instructions || 'No instructions available')}
            >
              <Icon name="info" size={20} color="#94A3B8" />
              <Text style={styles.quickActionText}>Tips</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => setCompletedExercises(prev => [...prev, currentExercise])}
            >
              <Icon name="check" size={20} color="#10B981" />
              <Text style={styles.quickActionText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Exercise List */}
          <View style={styles.exerciseListContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Workout Plan</Text>
              <Text style={styles.listSubtitle}>
                {completedExercises.length} of {exercises.length} completed
              </Text>
            </View>
            
            {exercises.map((exercise, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.exerciseListItem,
                  index === currentExercise && styles.activeExerciseListItem,
                  completedExercises.includes(index) && styles.completedExerciseListItem
                ]}
                onPress={() => {
                  if (index !== currentExercise) {
                    Alert.alert(
                      "Switch Exercise?",
                      `Switch to "${exercise.name}"?`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Switch", 
                          onPress: () => {
                            setCurrentExercise(index);
                            setExerciseTime(0);
                          }
                        }
                      ]
                    );
                  }
                }}
              >
                <View style={styles.exerciseItemContent}>
                  <View style={styles.exerciseItemLeft}>
                    <LinearGradient
                      colors={
                        index === currentExercise 
                          ? ['#7C3AED', '#6D28D9']
                          : completedExercises.includes(index)
                          ? ['#10B981', '#059669']
                          : ['#334155', '#1E293B']
                      }
                      style={styles.exerciseIndexCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {completedExercises.includes(index) ? (
                        <Icon name="check" size={16} color="white" />
                      ) : (
                        <Text style={[
                          styles.exerciseIndexText,
                          index === currentExercise && styles.activeExerciseIndexText
                        ]}>
                          {index + 1}
                        </Text>
                      )}
                    </LinearGradient>
                    
                    <View style={styles.exerciseItemDetails}>
                      <View style={styles.exerciseItemHeader}>
                        <Text style={[
                          styles.exerciseItemName,
                          index === currentExercise && styles.activeExerciseItemName,
                          completedExercises.includes(index) && styles.completedExerciseItemName
                        ]}>
                          {exercise.name}
                        </Text>
                        <View style={[
                          styles.difficultyDot,
                          { backgroundColor: getDifficultyColor(exercise.difficulty) }
                        ]} />
                      </View>
                      <Text style={styles.exerciseItemMeta}>
                        {exercise.type} • {exercise.duration ? `${exercise.duration}s` : `${exercise.sets} × ${exercise.reps}`}
                      </Text>
                    </View>
                  </View>
                  
                  {index === currentExercise && (
                    <View style={styles.currentExerciseIndicator}>
                      <Icon name="play-arrow" size={20} color="#7C3AED" />
                    </View>
                  )}
                  
                  {completedExercises.includes(index) && (
                    <View style={styles.completedIndicator}>
                      <Icon name="check-circle" size={20} color="#10B981" />
                    </View>
                  )}
                </View>
                
                {/* Progress line between exercises */}
                {index < exercises.length - 1 && (
                  <View style={[
                    styles.exerciseConnector,
                    completedExercises.includes(index) && styles.completedConnector
                  ]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Finish Button */}
      <Animated.View 
        style={[
          styles.floatingButtonContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.floatingFinishButton}
          onPress={() => {
            Alert.alert(
              "Finish Workout?",
              "Are you sure you want to finish this workout?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Finish", 
                  onPress: completeWorkoutHandler,
                  style: 'destructive'
                }
              ]
            );
          }}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.finishButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="flag" size={20} color="white" />
            <Text style={styles.floatingFinishText}>Finish Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  workoutTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
  },
  timerText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  calorieText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  videoSection: {
    position: 'relative',
  },
  videoContainer: {
    height: width * 0.6,
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  exerciseInfoCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  exerciseHeader: {
    marginBottom: 24,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumber: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  heartRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  heartRateText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseName: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exerciseDescription: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: width * 0.22,
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercent: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  exerciseProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 8,
  },
  controlButton: {
    alignItems: 'center',
    padding: 8,
    minWidth: 80,
  },
  prevButton: {
    alignItems: 'flex-start',
  },
  nextButton: {
    alignItems: 'flex-end',
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  disabledText: {
    color: '#64748B',
  },
  mainControl: {
    alignItems: 'center',
  },
  mainControlGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainControlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  completeButton: {
    opacity: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  exerciseListContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  exerciseListItem: {
    position: 'relative',
  },
  activeExerciseListItem: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: -4,
  },
  completedExerciseListItem: {
    opacity: 0.7,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  exerciseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIndexCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseIndexText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeExerciseIndexText: {
    color: 'white',
  },
  exerciseItemDetails: {
    flex: 1,
  },
  exerciseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  exerciseItemName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activeExerciseItemName: {
    color: '#7C3AED',
  },
  completedExerciseItemName: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  exerciseItemMeta: {
    color: '#64748B',
    fontSize: 13,
  },
  currentExerciseIndicator: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIndicator: {
    marginLeft: 8,
  },
  exerciseConnector: {
    height: 20,
    width: 2,
    backgroundColor: '#334155',
    marginLeft: 18,
    marginVertical: -10,
  },
  completedConnector: {
    backgroundColor: '#10B981',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  floatingFinishButton: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  finishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  floatingFinishText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});r
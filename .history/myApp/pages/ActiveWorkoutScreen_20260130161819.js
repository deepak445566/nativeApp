// pages/ActiveWorkoutScreen.js (REDESIGNED VERSION)
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
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';
import VideoPlayer from '../components/VideoPlayer';
import { BlurView } from 'expo-blur';

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
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [showExerciseList, setShowExerciseList] = useState(false);
  
  const timerRef = useRef(null);
  const exerciseTimerRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(height * 0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const exercises = workout.exercisesList || [];
  const currentExerciseData = exercises[currentExercise] || {};

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#000000');
    }

    startTimer();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 20,
        useNativeDriver: true,
      })
    ]).start();

    updateCalories();

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      clearTimers();
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    updateCalories();
    if (currentExerciseData.duration && exerciseTime >= currentExerciseData.duration) {
      handleVideoComplete();
    }
  }, [workoutTime, exerciseTime]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setWorkoutTime(prev => prev + 1);
      }
    }, 1000);
    
    startExerciseTimer();
  };

  const startExerciseTimer = () => {
    clearInterval(exerciseTimerRef.current);
    
    exerciseTimerRef.current = setInterval(() => {
      if (!isPaused && isVideoPlaying) {
        setExerciseTime(prev => prev + 1);
      }
    }, 1000);
  };

  const updateCalories = () => {
    const calories = Math.floor((workoutTime / 60) * 8) + (completedExercises.length * 5);
    setCaloriesBurned(calories);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoComplete = () => {
    setCompletedExercises(prev => [...prev, currentExercise]);
    
    if (currentExercise < exercises.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentExercise(prev => prev + 1);
        setExerciseTime(0);
      });
    } else {
      completeWorkoutHandler();
    }
  };

  const completeWorkoutHandler = () => {
    clearTimers();
    
    if (completeWorkout) {
      completeWorkout(workoutTime, caloriesBurned, completedExercises.length + 1);
    }
    
    navigation.navigate('WorkoutSummary', {
      workout,
      duration: workoutTime,
      calories: caloriesBurned,
      exercisesCompleted: completedExercises.length + 1
    });
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    setIsVideoPlaying(!isPaused);
    
    if (isPaused) {
      startExerciseTimer();
    }
  };

  const handleVideoPlayPause = (playing) => {
    setIsVideoPlaying(playing);
    setIsPaused(!playing);
  };

  const handleExerciseChange = (index) => {
    if (index !== currentExercise) {
      setCurrentExercise(index);
      setExerciseTime(0);
      setShowExerciseList(false);
    }
  };

  const getExerciseProgress = () => {
    if (!currentExerciseData.duration) return 0;
    return Math.min((exerciseTime / currentExerciseData.duration) * 100, 100);
  };

  const handleBackPress = () => {
    Alert.alert(
      "End Workout?",
      "Your progress will be saved. Are you sure you want to end?",
      [
        { text: "Continue Workout", style: "cancel" },
        { text: "End Workout", style: "destructive", onPress: () => navigation.goBack() }
      ]
    );
    return true;
  };

  const toggleExerciseList = () => {
    setShowExerciseList(!showExerciseList);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Gradient Header */}
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.95)', 'rgba(15, 23, 42, 0.2)']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      
      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Video Player with Overlay */}
        <View style={styles.videoContainer}>
          <VideoPlayer
            onClose={() => navigation.goBack()}
            workoutDuration={workout.duration}
            onVideoComplete={handleVideoComplete}
            onTimeUpdate={(time) => setExerciseTime(Math.floor(time))}
            onPlayPause={handleVideoPlayPause}
            isPlaying={isVideoPlaying}
            style={styles.videoPlayer}
          />
          
          {/* Video Overlay Controls */}
          <View style={styles.videoOverlay}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleBackPress}
            >
              <Icon name="close" size={28} color="white" />
            </TouchableOpacity>
            
            <View style={styles.videoTimerContainer}>
              <Icon name="access-time" size={20} color="white" style={styles.timerIcon} />
              <Text style={styles.videoTimer}>{formatTime(workoutTime)}</Text>
            </View>
            
            <View style={styles.videoCaloriesContainer}>
              <Icon name="local-fire-department" size={20} color="#FF6B6B" />
              <Text style={styles.videoCalories}>{caloriesBurned} cal</Text>
            </View>
          </View>
        </View>

        {/* Current Exercise Card */}
        <View style={styles.exerciseCard}>
          <LinearGradient
            colors={['#2A2F4C', '#1A1F3A']}
            style={styles.exerciseCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.exerciseCardHeader}>
              <View>
                <Text style={styles.exerciseCounter}>
                  {currentExercise + 1}/{exercises.length}
                </Text>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {currentExerciseData.name}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.listToggleButton}
                onPress={toggleExerciseList}
              >
                <Icon name="list" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    { width: `${getExerciseProgress()}%` }
                  ]}
                />
              </View>
              <View style={styles.progressTime}>
                <Text style={styles.progressText}>
                  {formatTime(exerciseTime)}
                </Text>
                {currentExerciseData.duration && (
                  <Text style={styles.progressText}>
                    {formatTime(currentExerciseData.duration)}
                  </Text>
                )}
              </View>
            </View>

            {/* Exercise Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Icon name="fitness-center" size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={styles.statValue}>
                  {currentExerciseData.type?.charAt(0).toUpperCase() + currentExerciseData.type?.slice(1) || 'N/A'}
                </Text>
              </View>

              {currentExerciseData.sets && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                    <Icon name="repeat" size={20} color="#22C55E" />
                  </View>
                  <Text style={styles.statLabel}>Sets</Text>
                  <Text style={styles.statValue}>{currentExerciseData.sets}</Text>
                </View>
              )}

              {currentExerciseData.reps && (
                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Icon name="functions" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.statLabel}>Reps</Text>
                  <Text style={styles.statValue}>{currentExerciseData.reps}</Text>
                </View>
              )}

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Icon name="timer" size={20} color="#EF4444" />
                </View>
                <Text style={styles.statLabel}>Time</Text>
                <Text style={styles.statValue}>
                  {currentExerciseData.duration ? `${currentExerciseData.duration}s` : 'Flexible'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Main Controls */}
        <View style={styles.mainControls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.prevButton]}
            onPress={() => currentExercise > 0 && handleExerciseChange(currentExercise - 1)}
            disabled={currentExercise === 0}
          >
            <Icon 
              name="chevron-left" 
              size={28} 
              color={currentExercise === 0 ? "#475569" : "white"} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={handlePauseResume}
          >
            <LinearGradient
              colors={isPaused ? ['#8B5CF6', '#7C3AED'] : ['#EF4444', '#DC2626']}
              style={styles.playPauseGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon 
                name={isPaused ? "play-arrow" : "pause"} 
                size={36} 
                color="white" 
              />
            </LinearGradient>
            <Text style={styles.playPauseText}>
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, styles.nextButton]}
            onPress={() => {
              if (currentExercise === exercises.length - 1) {
                completeWorkoutHandler();
              } else {
                handleExerciseChange(currentExercise + 1);
              }
            }}
          >
            <Icon 
              name={currentExercise === exercises.length - 1 ? "check-circle" : "chevron-right"} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              Alert.alert(
                "Skip Exercise",
                `Skip "${currentExerciseData.name}"?`,
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Skip", 
                    onPress: () => {
                      if (currentExercise < exercises.length - 1) {
                        handleExerciseChange(currentExercise + 1);
                      } else {
                        completeWorkoutHandler();
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Icon name="forward" size={20} color="#94A3B8" />
            <Text style={styles.quickActionText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => {
              // Add to favorites functionality
              Alert.alert("Added to Favorites", "Exercise saved to your favorites!");
            }}
          >
            <Icon name="favorite-border" size={20} color="#94A3B8" />
            <Text style={styles.quickActionText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowExerciseList(true)}
          >
            <Icon name="playlist-play" size={20} color="#94A3B8" />
            <Text style={styles.quickActionText}>Plan</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>

      {/* Exercise List Modal */}
      {showExerciseList && (
        <Animated.View style={styles.exerciseListModal}>
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Workout Plan</Text>
            <TouchableOpacity onPress={() => setShowExerciseList(false)}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView}>
            {exercises.map((exercise, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalExerciseItem,
                  index === currentExercise && styles.modalActiveExercise,
                  completedExercises.includes(index) && styles.modalCompletedExercise
                ]}
                onPress={() => handleExerciseChange(index)}
              >
                <View style={styles.modalExerciseLeft}>
                  <View style={[
                    styles.modalExerciseIndex,
                    index === currentExercise && styles.modalActiveIndex,
                    completedExercises.includes(index) && styles.modalCompletedIndex
                  ]}>
                    {completedExercises.includes(index) ? (
                      <Icon name="check" size={16} color="white" />
                    ) : (
                      <Text style={styles.modalIndexText}>{index + 1}</Text>
                    )}
                  </View>
                  
                  <View style={styles.modalExerciseInfo}>
                    <Text style={[
                      styles.modalExerciseName,
                      index === currentExercise && styles.modalActiveName,
                      completedExercises.includes(index) && styles.modalCompletedName
                    ]}>
                      {exercise.name}
                    </Text>
                    <View style={styles.modalExerciseMeta}>
                      <Text style={styles.modalExerciseType}>{exercise.type}</Text>
                      <Text style={styles.modalExerciseDuration}>
                        {exercise.duration ? `${exercise.duration}s` : `${exercise.sets} × ${exercise.reps}`}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {index === currentExercise && (
                  <View style={styles.currentPlaying}>
                    <Icon name="play-arrow" size={20} color="#8B5CF6" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={styles.finishWorkoutButton}
            onPress={completeWorkoutHandler}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.finishWorkoutText}>FINISH WORKOUT</Text>
            <Icon name="flag" size={20} color="white" style={styles.finishIcon} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Bottom Finish Button */}
      {!showExerciseList && (
        <TouchableOpacity 
          style={styles.floatingFinishButton}
          onPress={() => {
            Alert.alert(
              "Finish Workout?",
              "You're doing great! Finish and see your results.",
              [
                { text: "Continue", style: "cancel" },
                { text: "Finish", style: "destructive", onPress: completeWorkoutHandler }
              ]
            );
          }}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.finishButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="done-all" size={20} color="white" />
            <Text style={styles.floatingFinishText}>Finish Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.15,
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  videoContainer: {
    height: width * 0.6,
    position: 'relative',
  },
  videoPlayer: {
    flex: 1,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerIcon: {
    marginRight: 6,
  },
  videoTimer: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  videoCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  videoCalories: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  exerciseCard: {
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  exerciseCardGradient: {
    padding: 24,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  exerciseCounter: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  exerciseName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  listToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBackground: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  progressTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  mainControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 30,
    marginBottom: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    alignItems: 'center',
  },
  playPauseGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  playPauseText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginTop: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  exerciseListModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalExerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginBottom: 8,
  },
  modalActiveExercise: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  modalCompletedExercise: {
    opacity: 0.7,
  },
  modalExerciseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalExerciseIndex: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalActiveIndex: {
    backgroundColor: '#8B5CF6',
  },
  modalCompletedIndex: {
    backgroundColor: '#10B981',
  },
  modalIndexText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  modalExerciseInfo: {
    flex: 1,
  },
  modalExerciseName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalActiveName: {
    color: '#8B5CF6',
  },
  modalCompletedName: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  modalExerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalExerciseType: {
    color: '#94A3B8',
    fontSize: 12,
    marginRight: 12,
  },
  modalExerciseDuration: {
    color: '#64748B',
    fontSize: 12,
  },
  currentPlaying: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishWorkoutButton: {
    margin: 20,
    paddingVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  finishWorkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  finishIcon: {
    marginLeft: 8,
  },
  floatingFinishButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  finishButtonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  floatingFinishText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
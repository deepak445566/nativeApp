// pages/ActiveWorkoutScreen.js (FIXED VERSION)
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
  
  const exercises = workout.exercisesList || [];
  const currentExerciseData = exercises[currentExercise] || {};

  useEffect(() => {
    // Start workout timer
    startTimer();
    
    // Start fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

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

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Video Player */}
        <View style={styles.videoSection}>
          <VideoPlayer
            onClose={() => navigation.goBack()}
            workoutDuration={workout.duration}
            onVideoComplete={handleVideoComplete}
            onTimeUpdate={(time) => setExerciseTime(Math.floor(time))}
            onPlayPause={handleVideoPlayPause}
            isPlaying={!isPaused}
          />
        </View>

        {/* Exercise Info */}
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseNumber}>
              Exercise {currentExercise + 1} of {exercises.length}
            </Text>
            <Text style={styles.exerciseName}>{currentExerciseData.name}</Text>
          </View>
          
          <View style={styles.exerciseStats}>
            <View style={styles.statItem}>
              <Icon name="fitness-center" size={20} color="#7C3AED" />
              <Text style={styles.statLabel}>Type</Text>
              <Text style={styles.statValue}>
                {currentExerciseData.type?.charAt(0).toUpperCase() + currentExerciseData.type?.slice(1) || 'Exercise'}
              </Text>
            </View>
            
            {currentExerciseData.duration && (
              <View style={styles.statItem}>
                <Icon name="timer" size={20} color="#7C3AED" />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {formatTime(exerciseTime)} / {currentExerciseData.duration}s
                </Text>
              </View>
            )}
            
            {currentExerciseData.sets && (
              <View style={styles.statItem}>
                <Icon name="repeat" size={20} color="#7C3AED" />
                <Text style={styles.statLabel}>Sets</Text>
                <Text style={styles.statValue}>{currentExerciseData.sets}</Text>
              </View>
            )}
            
            {currentExerciseData.reps && (
              <View style={styles.statItem}>
                <Icon name="functions" size={20} color="#7C3AED" />
                <Text style={styles.statLabel}>Reps</Text>
                <Text style={styles.statValue}>{currentExerciseData.reps}</Text>
              </View>
            )}
          </View>
          
          {/* Exercise Progress Bar */}
          <View style={styles.exerciseProgress}>
            <View style={styles.exerciseProgressBar}>
              <View 
                style={[
                  styles.exerciseProgressFill,
                  { width: `${getExerciseProgress()}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[
              styles.controlButton,
              currentExercise === 0 && styles.disabledButton
            ]}
            onPress={handlePrevExercise}
            disabled={currentExercise === 0}
          >
            <Icon name="skip-previous" size={24} color={currentExercise === 0 ? "#64748B" : "white"} />
            <Text style={[
              styles.controlText,
              currentExercise === 0 && styles.disabledText
            ]}>
              Previous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.mainControlButton}
            onPress={handlePauseResume}
          >
            <Icon 
              name={isPaused ? "play-arrow" : "pause"} 
              size={32} 
              color="white" 
            />
            <Text style={styles.mainControlText}>
              {isPaused ? "Resume" : "Pause"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              currentExercise === exercises.length - 1 && styles.completeButton
            ]}
            onPress={currentExercise === exercises.length - 1 ? completeWorkoutHandler : handleNextExercise}
          >
            <Icon 
              name={currentExercise === exercises.length - 1 ? "check-circle" : "skip-next"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.controlText}>
              {currentExercise === exercises.length - 1 ? "Complete" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Exercise List */}
        <ScrollView style={styles.exerciseList} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Workout Plan</Text>
          {exercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.exerciseItem,
                index === currentExercise && styles.activeExerciseItem
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
              <View style={styles.exerciseItemLeft}>
                <View style={[
                  styles.exerciseIndex,
                  index === currentExercise && styles.activeExerciseIndex,
                  completedExercises.includes(index) && styles.completedExerciseIndex
                ]}>
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
                </View>
                <View style={styles.exerciseItemInfo}>
                  <Text style={[
                    styles.exerciseItemName,
                    index === currentExercise && styles.activeExerciseItemName,
                    completedExercises.includes(index) && styles.completedExerciseItemName
                  ]}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.exerciseItemType}>
                    {exercise.type} • {exercise.duration ? `${exercise.duration}s` : `${exercise.sets} × ${exercise.reps}`}
                  </Text>
                </View>
              </View>
              
              {index === currentExercise && (
                <View style={styles.currentIndicator}>
                  <Icon name="play-arrow" size={20} color="#7C3AED" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Bottom Controls */}
      <LinearGradient
        colors={['transparent', '#0F172A']}
        style={styles.bottomBar}
      >
        <TouchableOpacity 
          style={styles.finishButton}
          onPress={() => {
            Alert.alert(
              "Finish Workout?",
              "Are you sure you want to finish this workout?",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Finish", 
                  onPress: completeWorkoutHandler
                }
              ]
            );
          }}
        >
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerCenter: {
    alignItems: 'center',
    marginTop: 10,
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
    position: 'absolute',
    top: 50,
    right: 20,
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
  content: {
    flex: 1,
  },
  videoSection: {
    height: width * 0.5625,
  },
  exerciseInfo: {
    backgroundColor: '#1E293B',
    padding: 20,
    margin: 16,
    borderRadius: 20,
    marginTop: 20,
  },
  exerciseHeader: {
    marginBottom: 20,
  },
  exerciseNumber: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  exerciseName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseProgress: {
    marginTop: 10,
  },
  exerciseProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  exerciseProgressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 100,
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
  mainControlButton: {
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 20,
    minWidth: 120,
  },
  mainControlText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 80,
  },
  listTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeExerciseItem: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  exerciseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activeExerciseIndex: {
    backgroundColor: '#7C3AED',
  },
  completedExerciseIndex: {
    backgroundColor: '#10B981',
  },
  exerciseIndexText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeExerciseIndexText: {
    color: 'white',
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseItemName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  activeExerciseItemName: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  completedExerciseItemName: {
    color: '#10B981',
    textDecorationLine: 'line-through',
  },
  exerciseItemType: {
    color: '#64748B',
    fontSize: 12,
  },
  currentIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
  },
  finishButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
// pages/ActiveWorkoutScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { Video } from 'expo-av';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.5625; // 16:9 aspect ratio

// Video URLs for different workouts
const VIDEO_SOURCES = {
  'full-body-burn': { 
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
  },
  'cardio-blast': { 
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' 
  },
  'yoga-flow': { 
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
  },
  'strength-power': { 
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' 
  }
};

export default function ActiveWorkoutScreen({ route, navigation }) {
  const { workout } = route.params;
  const { completeWorkout } = useWorkout();
  
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const exerciseTimerRef = useRef(null);
  
  const [videoStatus, setVideoStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const exercises = workout.exercisesList || [];
  const currentExerciseData = exercises[currentExercise] || {};
  const videoSource = VIDEO_SOURCES[workout.videoId] || VIDEO_SOURCES['full-body-burn'];

  useEffect(() => {
    // Start workout timer
    startWorkoutTimer();
    
    // Setup back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // Auto-hide controls after 3 seconds
    if (showControls && isPlaying) {
      const hideTimer = setTimeout(() => {
        hideControls();
      }, 3000);
      return () => {
        clearTimeout(hideTimer);
        backHandler.remove();
        stopAllTimers();
      };
    }
    
    return () => {
      backHandler.remove();
      stopAllTimers();
    };
  }, [showControls, isPlaying]);

  useEffect(() => {
    // Update calories every 30 seconds
    updateCalories();
    
    // Update exercise progress
    if (currentExerciseData.duration && exerciseTime >= currentExerciseData.duration) {
      handleExerciseComplete();
    }
  }, [workoutTime, exerciseTime]);

  const startWorkoutTimer = () => {
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
      if (!isPaused && isPlaying) {
        setExerciseTime(prev => prev + 1);
      }
    }, 1000);
  };

  const stopAllTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (exerciseTimerRef.current) {
      clearInterval(exerciseTimerRef.current);
    }
  };

  const updateCalories = () => {
    // Calculate calories based on workout time and intensity
    const caloriesPerMinute = workout.difficulty === 'Advanced' ? 12 : 
                             workout.difficulty === 'Intermediate' ? 10 : 8;
    const calories = Math.floor((workoutTime / 60) * caloriesPerMinute);
    setCaloriesBurned(calories);
  };

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPaused(true);
      } else {
        await videoRef.current.playAsync();
        setIsPaused(false);
        startExerciseTimer();
      }
      setIsPlaying(!isPlaying);
      showControlsTemporarily();
    }
  };

  const handleSeek = async (seconds) => {
    if (videoRef.current && videoStatus.positionMillis) {
      const newPosition = Math.max(0, videoStatus.positionMillis + (seconds * 1000));
      await videoRef.current.setPositionAsync(newPosition);
      showControlsTemporarily();
    }
  };

  const handleExerciseComplete = () => {
    if (!completedExercises.includes(currentExercise)) {
      setCompletedExercises(prev => [...prev, currentExercise]);
    }
    
    if (currentExercise < exercises.length - 1) {
      // Move to next exercise
      setCurrentExercise(prev => prev + 1);
      setExerciseTime(0);
      
      // Reset exercise timer for new exercise
      if (exerciseTimerRef.current) {
        clearInterval(exerciseTimerRef.current);
      }
      startExerciseTimer();
      
      // Show next exercise alert
      const nextExercise = exercises[currentExercise + 1];
      Alert.alert(
        "Next Exercise",
        `Get ready for: ${nextExercise.name}`,
        [{ text: "Let's Go! 💪" }]
      );
    } else {
      // All exercises completed
      completeWorkoutHandler();
    }
  };

  const completeWorkoutHandler = () => {
    stopAllTimers();
    
    const totalExercises = exercises.length;
    const exercisesCompleted = completedExercises.length + 1; // +1 for current exercise
    
    navigation.navigate('WorkoutSummary', {
      workout,
      duration: workoutTime,
      calories: caloriesBurned,
      exercisesCompleted
    });
  };

  const handleVideoComplete = () => {
    // When video ends, mark exercise as complete
    handleExerciseComplete();
  };

  const handleBackPress = () => {
    Alert.alert(
      "End Workout?",
      "Are you sure you want to end this workout? Your progress will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Workout", 
          onPress: () => {
            stopAllTimers();
            navigation.goBack();
          }
        }
      ]
    );
    return true;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (isPlaying) {
      setTimeout(() => {
        hideControls();
      }, 3000);
    }
  };

  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsTemporarily();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getExerciseProgress = () => {
    if (!currentExerciseData.duration) return 0;
    return Math.min((exerciseTime / currentExerciseData.duration) * 100, 100);
  };

  const getWorkoutProgress = () => {
    return Math.min((currentExercise / exercises.length) * 100, 100);
  };

  const handleSkipExercise = () => {
    Alert.alert(
      "Skip Exercise?",
      `Are you sure you want to skip ${currentExerciseData.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Skip", 
          onPress: () => handleExerciseComplete()
        }
      ]
    );
  };

  const handlePreviousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(prev => prev - 1);
      setExerciseTime(0);
      startExerciseTimer();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Workout Header */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
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
        </View>
        
        {/* Workout Progress */}
        <View style={styles.workoutProgress}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { 
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%']
                  })
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentExercise + 1} of {exercises.length} exercises
          </Text>
        </View>
      </LinearGradient>

      {/* Video Player Section */}
      <View style={styles.videoSection}>
        <Video
          ref={videoRef}
          source={videoSource}
          style={styles.video}
          resizeMode="contain"
          shouldPlay={false}
          isLooping={false}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status) => {
            setVideoStatus(status);
            if (status.isLoaded && isLoading) {
              setIsLoading(false);
            }
            if (status.didJustFinish) {
              handleVideoComplete();
            }
          }}
          onError={(error) => {
            console.error('Video Error:', error);
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading workout video...</Text>
          </View>
        )}

        {/* Video Controls Overlay */}
        <Animated.View 
          style={[
            styles.controlsOverlay,
            { opacity: fadeAnim }
          ]}
          pointerEvents={showControls ? 'auto' : 'none'}
        >
          {/* Top Controls */}
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent']}
            style={styles.topControls}
          >
            <View style={styles.controlsRow}>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{workout.title}</Text>
                <Text style={styles.videoTime}>
                  {videoStatus.positionMillis ? 
                    formatTime(videoStatus.positionMillis / 1000) : '0:00'
                  } / {videoStatus.durationMillis ? 
                    formatTime(videoStatus.durationMillis / 1000) : workout.duration
                  }
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.fullscreenButton}
                onPress={() => {/* Fullscreen logic */}}
              >
                <Icon name="fullscreen" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Center Play Button */}
          <TouchableOpacity 
            style={styles.centerPlayButton}
            onPress={handlePlayPause}
          >
            <Icon 
              name={isPlaying ? "pause-circle-filled" : "play-circle-filled"} 
              size={80} 
              color="rgba(255,255,255,0.9)" 
            />
          </TouchableOpacity>

          {/* Bottom Controls */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bottomControls}
          >
            <View style={styles.controlsRow}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleSeek(-10)}
              >
                <Icon name="replay-10" size={28} color="white" />
                <Text style={styles.controlLabel}>10s</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.playPauseButton}
                onPress={handlePlayPause}
              >
                <Icon 
                  name={isPlaying ? "pause" : "play-arrow"} 
                  size={32} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleSeek(10)}
              >
                <Icon name="forward-10" size={28} color="white" />
                <Text style={styles.controlLabel}>10s</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tap to show controls */}
        <TouchableOpacity 
          style={styles.tapArea}
          onPress={toggleControls}
          activeOpacity={1}
        />
      </View>

      {/* Current Exercise Info */}
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
          
          {currentExerciseData.duration ? (
            <View style={styles.statItem}>
              <Icon name="timer" size={20} color="#7C3AED" />
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>
                {formatTime(exerciseTime)} / {currentExerciseData.duration}s
              </Text>
            </View>
          ) : (
            <View style={styles.statItem}>
              <Icon name="repeat" size={20} color="#7C3AED" />
              <Text style={styles.statLabel}>Sets & Reps</Text>
              <Text style={styles.statValue}>
                {currentExerciseData.sets} × {currentExerciseData.reps}
              </Text>
            </View>
          )}
          
          <View style={styles.statItem}>
            <Icon name="trending-up" size={20} color="#7C3AED" />
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={styles.statValue}>
              {Math.round(getExerciseProgress())}%
            </Text>
          </View>
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

      {/* Exercise Controls */}
      <View style={styles.exerciseControls}>
        <TouchableOpacity 
          style={[
            styles.exerciseControlButton,
            currentExercise === 0 && styles.disabledButton
          ]}
          onPress={handlePreviousExercise}
          disabled={currentExercise === 0}
        >
          <Icon name="skip-previous" size={24} color={currentExercise === 0 ? "#64748B" : "white"} />
          <Text style={[
            styles.exerciseControlText,
            currentExercise === 0 && styles.disabledText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkipExercise}
        >
          <Icon name="skip-next" size={24} color="#EF4444" />
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={handleExerciseComplete}
        >
          <Icon name="check-circle" size={24} color="white" />
          <Text style={styles.completeButtonText}>Complete</Text>
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
                        startExerciseTimer();
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    paddingHorizontal: 10,
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
  workoutProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  videoSection: {
    height: VIDEO_HEIGHT,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 14,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  playPauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
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
  exerciseControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exerciseControlButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  exerciseControlText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  disabledText: {
    color: '#64748B',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
    minWidth: 100,
  },
  skipButtonText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  completeButton: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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
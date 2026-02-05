// components/VideoPlayer.js (FIXED with fallback)
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Text,
  Animated
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.5625; // 16:9 aspect ratio

export default function VideoPlayer({ 
  onClose, 
  workoutDuration,
  onVideoComplete,
  onTimeUpdate,
  onPlayPause,
  isPlaying: externalIsPlaying
}) {
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(externalIsPlaying || false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Simulate video duration (30 minutes in seconds)
  const totalDuration = 30 * 60; // 30 minutes in seconds
  const timerRef = useRef(null);

  useEffect(() => {
    if (isVideoPlaying) {
      startTimer();
    } else {
      stopTimer();
    }
    
    return () => {
      stopTimer();
    };
  }, [isVideoPlaying]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds when playing
    if (showControls && isVideoPlaying) {
      const timer = setTimeout(() => {
        hideControls();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, isVideoPlaying]);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 1;
        
        // Update progress animation
        const progress = (newTime / totalDuration) * 100;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }).start();

        // Notify parent of time update
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }

        // Check if video completed
        if (newTime >= totalDuration && onVideoComplete) {
          stopTimer();
          onVideoComplete();
        }

        return newTime;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePlayPause = () => {
    const newPlayingState = !isVideoPlaying;
    setIsVideoPlaying(newPlayingState);
    
    if (onPlayPause) {
      onPlayPause(newPlayingState);
    }
    
    showControlsTemporarily();
  };

  const handleSeek = (seconds) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, totalDuration));
    setCurrentTime(newTime);
    
    const progress = (newTime / totalDuration) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
    
    showControlsTemporarily();
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (isVideoPlaying) {
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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    showControlsTemporarily();
  };

  return (
    <View style={[
      styles.container, 
      isFullscreen ? styles.fullscreenContainer : { height: VIDEO_HEIGHT }
    ]}>
      {/* Video Placeholder */}
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.videoPlaceholder}
      >
        <View style={styles.videoPlaceholderContent}>
          <Icon name="fitness-center" size={80} color="#7C3AED" />
          <Text style={styles.videoPlaceholderTitle}>Workout Session</Text>
          <Text style={styles.videoPlaceholderSubtitle}>
            {isVideoPlaying ? "Workout in progress..." : "Ready to start your workout"}
          </Text>
          
          <View style={styles.videoStats}>
            <View style={styles.videoStat}>
              <Icon name="access-time" size={20} color="#7C3AED" />
              <Text style={styles.videoStatText}>
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </Text>
            </View>
            <View style={styles.videoStat}>
              <Icon name="local-fire-department" size={20} color="#EF4444" />
              <Text style={styles.videoStatText}>
                {Math.floor((currentTime / 60) * 8)} cal
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Controls Overlay */}
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
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                Workout Session
              </Text>
              <Text style={styles.videoTime}>
                {formatTime(currentTime)} / {workoutDuration || formatTime(totalDuration)}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.fullscreenButton}
              onPress={handleFullscreen}
            >
              <Icon 
                name={isFullscreen ? "fullscreen-exit" : "fullscreen"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
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
            <View style={styles.progressThumb} />
          </View>
        </LinearGradient>

        {/* Center Play Button */}
        <TouchableOpacity 
          style={styles.centerPlayButton}
          onPress={handlePlayPause}
        >
          <Icon 
            name={isVideoPlaying ? "pause-circle-filled" : "play-circle-filled"} 
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
                name={isVideoPlaying ? "pause" : "play-arrow"} 
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
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoPlaceholderContent: {
    alignItems: 'center',
  },
  videoPlaceholderTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  videoPlaceholderSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  videoStats: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 20,
  },
  videoStat: {
    alignItems: 'center',
    gap: 8,
  },
  videoStatText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  videoTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
  },
  progressThumb: {
    position: 'absolute',
    left: '50%',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    marginLeft: -8,
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
    minWidth: 60,
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
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
  },
});
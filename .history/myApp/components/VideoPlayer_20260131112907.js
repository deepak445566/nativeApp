// components/VideoPlayer.js
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Text,
  Animated,
  PanResponder
} from 'react-native';
import { ResizeMode, Video, Audio } from 'expo-av'; // Correct import
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.5625; // 16:9 aspect ratio

export default function VideoPlayer({ 
  videoSource, 
  onClose, 
  workoutDuration,
  onVideoComplete,
  onTimeUpdate,
  onPlayPause,
  isPlaying: externalIsPlaying
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Initialize video settings
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }, []);

  // For testing - use sample video URLs
 // components/VideoPlayer.js
const getVideoSource = () => {
  if (videoSource && videoSource.uri) {
    return videoSource;
  }
  
  // Use local video with require()
  return require('../assets/videos/workout.mp4');
};

  useEffect(() => {
    if (status) {
      // Update progress animation
      if (status.positionMillis && status.durationMillis) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }

      // Notify parent of time update
      if (onTimeUpdate && status.positionMillis) {
        onTimeUpdate(status.positionMillis / 1000);
      }

      // Check if video completed
      if (status.didJustFinish && onVideoComplete) {
        onVideoComplete();
      }
    }
  }, [status]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds when playing
    if (showControls && status?.isPlaying) {
      const timer = setTimeout(() => {
        hideControls();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, status?.isPlaying]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (status?.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      if (onPlayPause) {
        onPlayPause(!status?.isPlaying);
      }
    }
    showControlsTemporarily();
  };

  const handleSeek = async (seconds) => {
    if (videoRef.current && status?.positionMillis) {
      const newPosition = Math.max(0, status.positionMillis + (seconds * 1000));
      await videoRef.current.setPositionAsync(newPosition);
      showControlsTemporarily();
    }
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (status?.isPlaying) {
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

  if (error) {
    return (
      <View style={[styles.container, { height: VIDEO_HEIGHT }]}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Video Load Error</Text>
          <Text style={styles.errorSubtext}>Please check your connection</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(null);
              setIsLoading(true);
            }}
          >
            <Icon name="refresh" size={20} color="white" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container, 
      isFullscreen ? styles.fullscreenContainer : { height: VIDEO_HEIGHT }
    ]}>
      <Video
        ref={videoRef}
        source={getVideoSource()}
        style={isFullscreen ? styles.fullscreenVideo : styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={externalIsPlaying || false}
        isLooping={false}
        useNativeControls={false}
        onPlaybackStatusUpdate={(playbackStatus) => {
          setStatus(playbackStatus);
          if (playbackStatus.isLoaded && isLoading) {
            setIsLoading(false);
          }
        }}
        onError={(error) => {
          console.error('Video Error:', error);
          setError(error.message || 'Failed to load video');
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
                {formatTime(status?.positionMillis)} / {formatTime(status?.durationMillis) || workoutDuration}
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
            name={status?.isPlaying ? "pause-circle-filled" : "play-circle-filled"} 
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
                name={status?.isPlaying ? "pause" : "play-arrow"} 
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
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
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
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
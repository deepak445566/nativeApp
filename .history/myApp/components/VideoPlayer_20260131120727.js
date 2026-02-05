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
  Alert
} from 'react-native';
import { ResizeMode, Video, Audio } from 'expo-av';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 0.5625;

export default function VideoPlayer({ 
  videoSource, 
  onClose, 
  workoutDuration,
  onVideoComplete,
  onTimeUpdate,
  onPlayPause,
  isPlaying: externalIsPlaying,
  shouldLoop = true
}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // ✅ Initialize and cleanup
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      cleanupVideo();
    };
  }, []);

  // ✅ Video cleanup function
  const cleanupVideo = async () => {
    try {
      console.log('Cleaning up video...');
      if (videoRef.current) {
        await videoRef.current.stopAsync();
        await videoRef.current.unloadAsync();
      }
      setIsVideoLoaded(false);
    } catch (error) {
      console.log('Video cleanup error:', error);
    }
  };

  // Get video source
  const getVideoSource = () => {
    if (videoSource && videoSource.uri) {
      return videoSource;
    }
    return require('../assets/video/video.mp4');
  };

  useEffect(() => {
    if (status) {
      if (status.positionMillis && status.durationMillis) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 100,
          useNativeDriver: false,
        }).start();
      }

      if (onTimeUpdate && status.positionMillis) {
        onTimeUpdate(status.positionMillis / 1000);
      }

      if (status.didJustFinish && onVideoComplete) {
        onVideoComplete();
      }
    }
  }, [status]);

  useEffect(() => {
    if (showControls && status?.isPlaying) {
      const timer = setTimeout(() => {
        hideControls();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, status?.isPlaying]);

  // Handle play/pause
  const handlePlayPause = async () => {
    try {
      if (videoRef.current && isVideoLoaded) {
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
    } catch (error) {
      console.log('Play/Pause error:', error);
    }
  };

  // Handle seek
  const handleSeek = async (seconds) => {
    try {
      if (videoRef.current && status?.positionMillis && isVideoLoaded) {
        const newPosition = Math.max(0, status.positionMillis + (seconds * 1000));
        await videoRef.current.setPositionAsync(newPosition);
        showControlsTemporarily();
      }
    } catch (error) {
      console.log('Seek error:', error);
    }
  };

  // Restart video
  const handleRestart = async () => {
    try {
      if (videoRef.current && isVideoLoaded) {
        await videoRef.current.setPositionAsync(0);
        await videoRef.current.playAsync();
        showControlsTemporarily();
      }
    } catch (error) {
      console.log('Restart error:', error);
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

  // Handle close
  const handleClose = () => {
    cleanupVideo();
    if (onClose) onClose();
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
        isLooping={shouldLoop}
        useNativeControls={false}
        onPlaybackStatusUpdate={(playbackStatus) => {
          setStatus(playbackStatus);
          if (playbackStatus.isLoaded && isLoading) {
            setIsLoading(false);
            setIsVideoLoaded(true);
          }
        }}
        onError={(error) => {
          console.error('Video Error:', error);
          setError(error.message || 'Failed to load video');
          setIsLoading(false);
        }}
        onLoad={() => {
          setIsLoading(false);
          setIsVideoLoaded(true);
        }}
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
            <TouchableOpacity style={styles.backButton} onPress={handleClose}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {shouldLoop ? "Workout Loop" : "Workout Session"}
              </Text>
              <Text style={styles.videoTime}>
                {formatTime(status?.positionMillis)} / {formatTime(status?.durationMillis) || workoutDuration}
                {shouldLoop && " 🔁"}
              </Text>
            </View>
            
            <View style={styles.rightControls}>
              <TouchableOpacity 
                style={[
                  styles.loopButton,
                  shouldLoop && styles.loopButtonActive
                ]}
                onPress={() => {
                  Alert.alert("Loop Mode", "Video is set to loop continuously");
                }}
              >
                <Icon 
                  name="repeat" 
                  size={20} 
                  color={shouldLoop ? "#7C3AED" : "white"} 
                />
              </TouchableOpacity>
              
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
          </View>
          
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
              style={styles.controlButton}
              onPress={handleRestart}
            >
              <Icon name="replay" size={28} color="white" />
              <Text style={styles.controlLabel}>Restart</Text>
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
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (videoRef.current && status?.durationMillis && isVideoLoaded) {
                  const restartPosition = Math.max(0, status.durationMillis - 3000);
                  videoRef.current.setPositionAsync(restartPosition);
                }
              }}
            >
              <Icon name="skip-next" size={28} color="white" />
              <Text style={styles.controlLabel}>End</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

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
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loopButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
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
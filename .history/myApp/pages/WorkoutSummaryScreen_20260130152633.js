// pages/WorkoutSummaryScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkout } from '../context/WorkoutContext';

const { width } = Dimensions.get('window');

export default function WorkoutSummaryScreen({ route, navigation }) {
  const { workout, duration, calories, exercisesCompleted } = route.params;
  const { completeWorkout } = useWorkout();

  React.useEffect(() => {
    // Save workout completion
    completeWorkout(duration, calories, exercisesCompleted);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAchievement = () => {
    if (duration > 1800) return "Marathon Runner 🏃‍♂️";
    if (calories > 300) return "Calorie Burner 🔥";
    if (exercisesCompleted > 8) return "Exercise Master 💪";
    return "Great Start! 🌟";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Icon name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout Summary</Text>
          <View style={styles.emptyView} />
        </View>

        {/* Celebration Card */}
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          style={styles.celebrationCard}
        >
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>Workout Complete!</Text>
            <Text style={styles.celebrationSubtitle}>You crushed it!</Text>
          </View>
        </LinearGradient>

        {/* Achievement */}
        <View style={styles.achievementCard}>
          <Icon name="emoji-events" size={32} color="#F59E0B" />
          <Text style={styles.achievementText}>{getAchievement()}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="access-time" size={24} color="#7C3AED" />
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="local-fire-department" size={24} color="#EF4444" />
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="fitness-center" size={24} color="#10B981" />
            <Text style={styles.statValue}>{exercisesCompleted}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{Math.round((exercisesCompleted / workout.exercises) * 100)}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>

        {/* Workout Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Workout Details</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Workout</Text>
            <Text style={styles.detailValue}>{workout.title}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Difficulty</Text>
            <Text style={styles.detailValue}>{workout.difficulty}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {workout.exercisesList[0]?.type || 'Full Body'}
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Next Steps</Text>
          <TouchableOpacity 
            style={styles.nextStepButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Icon name="home" size={20} color="#7C3AED" />
            <Text style={styles.nextStepText}>Back to Dashboard</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.nextStepButton}
            onPress={() => navigation.navigate('ActiveWorkout', { workout })}
          >
            <Icon name="replay" size={20} color="#7C3AED" />
            <Text style={styles.nextStepText}>Repeat Workout</Text>
            <Icon name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => {/* Share functionality */}}
          >
            <Icon name="share" size={20} color="#7C3AED" />
            <Text style={styles.shareButtonText}>Share Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  content: {
    flex: 1,
    padding: 24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  emptyView: {
    width: 40
  },
  celebrationCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24
  },
  celebrationContent: {
    alignItems: 'center'
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: 16
  },
  celebrationTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8
  },
  celebrationSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  achievementText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280'
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280'
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  nextStepsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  nextStepText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    gap: 8
  },
  shareButtonText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '600'
  },
  doneButton: {
    flex: 2,
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
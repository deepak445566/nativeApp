// context/WorkoutContext.js
import React, { createContext, useState, useContext } from 'react';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [currentWorkout, setCurrentWorkout] = useState(null);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [workoutStats, setWorkoutStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    totalCalories: 0,
    streak: 0
  });

  const startWorkout = (workout) => {
    setCurrentWorkout({
      ...workout,
      startTime: new Date(),
      completedExercises: 0,
      isActive: true
    });
  };

  const completeWorkout = (duration, calories, exercisesCompleted) => {
    if (currentWorkout) {
      const completedWorkout = {
        ...currentWorkout,
        endTime: new Date(),
        duration,
        calories,
        exercisesCompleted,
        completedAt: new Date().toISOString()
      };

      setCompletedWorkouts(prev => [...prev, completedWorkout]);
      setWorkoutStats(prev => ({
        totalWorkouts: prev.totalWorkouts + 1,
        totalMinutes: prev.totalMinutes + Math.round(duration / 60),
        totalCalories: prev.totalCalories + calories,
        streak: prev.streak + 1
      }));
      setCurrentWorkout(null);
      
      return completedWorkout;
    }
  };

  const getWorkoutProgress = (workoutId) => {
    return completedWorkouts.filter(w => w.id === workoutId).length;
  };

  const getTodayWorkouts = () => {
    const today = new Date().toDateString();
    return completedWorkouts.filter(workout => 
      new Date(workout.completedAt).toDateString() === today
    );
  };

  return (
    <WorkoutContext.Provider value={{
      currentWorkout,
      completedWorkouts,
      workoutStats,
      startWorkout,
      completeWorkout,
      getWorkoutProgress,
      getTodayWorkouts,
      setCurrentWorkout
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);
// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Save messages to storage
  const saveMessages = useCallback(async (msgs) => {
    try {
      await SecureStore.setItemAsync('diet_planner_messages', JSON.stringify(msgs));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, []);

  // Load messages from storage
  const loadMessages = useCallback(async () => {
    try {
      const saved = await SecureStore.getItemAsync('diet_planner_messages');
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Clear all messages
  const clearMessages = useCallback(async () => {
    setMessages([]);
    try {
      await SecureStore.deleteItemAsync('diet_planner_messages');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }, []);

  // Generate diet plan
  const generateDietPlan = useCallback(async (userData) => {
    const { age, gender, weight, height, goal, medicalConditions } = userData;
    
    // Calculate BMI
    const heightInMeters = parseFloat(height) / 100;
    const bmi = (parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(1);
    
    // Calculate calories
    let bmr;
    if (gender === 'male') {
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) + 5;
    } else {
      bmr = 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseInt(age) - 161;
    }
    
    const tdee = bmr * 1.55; // Moderate activity
    let targetCalories = goal === 'weight_loss' ? Math.round(tdee * 0.85) : Math.round(tdee * 1.15);
    
    // Get BMI category
    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    // Create user message
    const userMessage = {
      role: 'user',
      content: `Create a diet plan for me. I'm ${age} years old, ${gender}, weight ${weight}kg, height ${height}cm. My goal is ${goal}. Medical conditions: ${medicalConditions || 'none'}`,
      timestamp: new Date().toISOString(),
      type: 'diet_request'
    };

    // Add user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY) {
        throw new Error('API key not found');
      }

      // Create detailed prompt
      const dietPrompt = `Create a COMPLETE personalized diet plan for the following person:

AGE: ${age} years
GENDER: ${gender}
WEIGHT: ${weight} kg
HEIGHT: ${height} cm
GOAL: ${goal}
MEDICAL CONDITIONS: ${medicalConditions || 'None'}

Calculated BMI: ${bmi} (${bmiCategory})
Daily Calorie Target: ${targetCalories} calories

IMPORTANT: Provide a COMPLETE 7-day diet plan with these sections:

1. DAILY NUTRITION GOALS
   - Calorie target: ${targetCalories} calories
   - Protein: __ grams
   - Carbs: __ grams
   - Fats: __ grams
   - Water: 3-4 liters

2. RECOMMENDED FOODS
   - List healthy foods
   - Portion sizes
   - Cooking methods

3. FOODS TO AVOID
   - List unhealthy foods
   - Reason to avoid

4. 7-DAY MEAL PLAN (Detailed)
   MONDAY:
   - Breakfast: [detailed meal with portions]
   - Lunch: [detailed meal with portions]
   - Dinner: [detailed meal with portions]
   - Snacks: [2 healthy snacks]
   
   [Repeat for Tuesday to Sunday]

5. GROCERY SHOPPING LIST
   - Vegetables & Fruits
   - Proteins
   - Carbs
   - Healthy fats
   - Spices & Herbs

6. MEAL PREP TIPS
   - How to prepare meals
   - Storage instructions
   - Time-saving tips

7. ${goal === 'weight_loss' ? 'WEIGHT LOSS TIPS' : 'WEIGHT GAIN TIPS'}
   - Practical advice
   - Common mistakes to avoid
   - Exercise recommendations

Make it VERY DETAILED and practical. Include exact portion sizes (in grams/cups).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: dietPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
          type: 'diet_plan'
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await saveMessages(finalMessages);
        return aiMessage;
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I couldn't generate your diet plan. Please check:\n1. Your internet connection\n2. API key configuration\n3. Try again in a moment\n\nError: ${error.message}`,
        timestamp: new Date().toISOString(),
        type: 'error'
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await saveMessages(finalMessages);
      return errorMessage;
    } finally {
      setLoading(false);
    }
  }, [messages, saveMessages]);

  // Send regular message
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      type: 'chat'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ 
                text: `You are a nutrition expert. Answer questions about diet and nutrition helpfully.\n\nUser: ${message}` 
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
          type: 'chat'
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await saveMessages(finalMessages);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "Sorry, I'm having trouble responding. Please try again.",
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await saveMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  }, [messages, saveMessages]);

  return (
    <GeminiContext.Provider value={{
      messages,
      loading,
      generateDietPlan,
      sendMessage,
      clearMessages,
      loadMessages,
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);
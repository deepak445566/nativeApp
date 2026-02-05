// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Save conversation
  const saveConversation = useCallback(async (messagesToSave) => {
    try {
      await SecureStore.setItemAsync('gemini_messages', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, []);

  // Load conversation
  const loadConversation = useCallback(async () => {
    try {
      const savedMessages = await SecureStore.getItemAsync('gemini_messages');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  // Send message to Gemini with better prompt
  const sendMessage = useCallback(async (message, isDietPlan = false) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      isDietPlan: isDietPlan
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
        throw new Error('API key not configured. Please add EXPO_PUBLIC_GEMINI_API_KEY to your .env file');
      }

      console.log('Sending request to Gemini API...');
      
      // Different prompts for diet plan vs normal chat
      let systemPrompt = "";
      
      if (isDietPlan) {
        systemPrompt = `You are an expert nutritionist and dietitian. Create a detailed, personalized diet plan. Format your response with:

        **Personalized Diet Plan**
        
        **Daily Calorie Target:** [Number] calories
        
        **Macronutrient Breakdown:**
        • Carbohydrates: [X]%
        • Protein: [Y]%
        • Fats: [Z]%
        
        **Recommended Foods:**
        • [List foods]
        
        **Foods to Avoid:**
        • [List foods]
        
        **Sample 7-Day Meal Plan:**
        Monday:
        • Breakfast: [Meal]
        • Lunch: [Meal]
        • Dinner: [Meal]
        • Snacks: [Snack]
        
        [Continue for all 7 days]
        
        **Hydration:** Drink 3-4 liters of water daily
        
        **Tips for Success:** [Provide practical tips]
        
        Make it detailed and actionable.`;
      } else {
        systemPrompt = `You are a fitness and nutrition assistant. Provide helpful, practical advice about workouts, nutrition, and healthy living.`;
      }

      const fullPrompt = isDietPlan ? message : `${systemPrompt}\n\nUser: ${message}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: fullPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 2000,
            }
          })
        }
      );

      console.log('API Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
          isDietPlan: isDietPlan
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await saveConversation(finalMessages);
        return aiMessage;
      } else {
        console.error('Unexpected API response:', data);
        throw new Error('No valid response from AI');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      let errorMessage = '';
      if (error.message.includes('API key')) {
        errorMessage = "Please configure your Gemini API key in .env file: EXPO_PUBLIC_GEMINI_API_KEY=your_key_here";
      } else if (error.message.includes('failed with status')) {
        errorMessage = "Network error. Please check your internet connection.";
      } else {
        errorMessage = "I apologize, but I'm having technical difficulties. Please try again in a moment.";
      }

      const errorResponse = {
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, errorResponse];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
      return errorResponse;
    } finally {
      setLoading(false);
    }
  }, [messages, saveConversation]);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    setMessages([]);
    try {
      await SecureStore.deleteItemAsync('gemini_messages');
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  }, []);

  // Generate diet plan with specific parameters
  const generateDietPlan = useCallback(async (userData) => {
    const {
      age,
      gender,
      weight,
      height,
      goal,
      medicalConditions = ''
    } = userData;

    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    // Calculate BMR (Basal Metabolic Rate)
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calculate TDEE (Total Daily Energy Expenditure)
    // Using moderate activity level (1.55 multiplier)
    const tdee = bmr * 1.55;

    // Adjust for goal
    let targetCalories;
    if (goal === 'weight_loss') {
      targetCalories = Math.round(tdee * 0.85); // 15% deficit
    } else {
      targetCalories = Math.round(tdee * 1.15); // 15% surplus
    }

    const dietPrompt = `
    Create a detailed personalized diet plan for:
    
    **User Profile:**
    • Age: ${age} years
    • Gender: ${gender}
    • Weight: ${weight} kg
    • Height: ${height} cm
    • BMI: ${bmi}
    • Goal: ${goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'}
    • Medical Conditions: ${medicalConditions || 'None'}
    
    **Calculations:**
    • Daily Calorie Target: ${targetCalories} calories
    • BMI Status: ${getBmiStatus(bmi)}
    
    **Requirements:**
    Create a COMPLETE diet plan including:
    
    1. **Daily Nutrition Goals:**
       • Calorie target: ${targetCalories} calories
       • Macronutrient breakdown (carbs/protein/fat percentages)
       • Fiber intake recommendations
       • Water intake (3-4 liters daily)
    
    2. **Food Recommendations:**
       • Best foods to eat for ${goal === 'weight_loss' ? 'weight loss' : 'weight gain'}
       • Foods to avoid
       • Healthy snacks
       • Cooking methods
    
    3. **Sample 7-Day Meal Plan:**
       Provide detailed meals for each day including:
       • Breakfast
       • Mid-morning snack
       • Lunch
       • Evening snack
       • Dinner
    
    4. **Practical Tips:**
       • Meal timing
       • Portion sizes
       • Grocery shopping list
       • Meal prep suggestions
    
    5. **For ${goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'}:**
       • Specific strategies
       • Expected timeline
       • Common mistakes to avoid
    
    Make it very detailed, practical, and easy to follow. Include exact portion sizes and timing.
    `;

    return await sendMessage(dietPrompt, true);
  }, [sendMessage]);

  return (
    <GeminiContext.Provider value={{
      messages,
      loading,
      sendMessage,
      generateDietPlan,
      clearConversation,
      loadConversation,
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

// Helper function to get BMI status
function getBmiStatus(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export const useGemini = () => useContext(GeminiContext);r
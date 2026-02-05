// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

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
    setLastError(null);
    try {
      await SecureStore.deleteItemAsync('diet_planner_messages');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }, []);

  // Test API connection
  const testApiConnection = useCallback(async () => {
    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY) {
        throw new Error('API key not found. Please check your .env file.');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: "Hello" }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API error');
      }

      return { success: true, message: 'API connection successful' };
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
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
    setLastError(null);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY) {
        throw new Error('API key not found. Please check your .env file.');
      }

      // First, test the API connection
      const connectionTest = await testApiConnection();
      if (!connectionTest.success) {
        throw new Error(`API connection failed: ${connectionTest.message}`);
      }

      // Create optimized prompt for better results
      const dietPrompt = `Generate a DETAILED, COMPREHENSIVE, and PRACTICAL 7-day personalized diet plan with exact portions and measurements.

USER PROFILE:
- Age: ${age} years
- Gender: ${gender}
- Weight: ${weight} kg
- Height: ${height} cm
- Goal: ${goal}
- Medical Conditions: ${medicalConditions || 'None'}
- BMI: ${bmi} (${bmiCategory})
- Daily Calorie Target: ${targetCalories} calories

IMPORTANT INSTRUCTIONS:
1. Generate COMPLETE 7-day meal plan (Monday to Sunday)
2. Include EXACT portion sizes in grams/cups/tablespoons
3. Include calorie count for each meal
4. Make it practical and easy to follow
5. Consider ${goal === 'weight_loss' ? 'calorie deficit' : 'calorie surplus'}
6. Include cooking instructions
7. Account for ${medicalConditions ? medicalConditions : 'no medical conditions'}

REQUIRED SECTIONS (generate ALL):

1. DAILY NUTRITION TARGETS
   • Total Calories: ${targetCalories}
   • Protein: __ grams (__ calories)
   • Carbohydrates: __ grams (__ calories)
   • Fats: __ grams (__ calories)
   • Fiber: __ grams
   • Water: 3-4 liters

2. 7-DAY DETAILED MEAL PLAN

MONDAY
• BREAKFAST (7-8 AM):
  - Meal: [Detailed description]
  - Ingredients: [List with exact quantities]
  - Calories: __ kcal
  - Prep Time: __ minutes

• MID-MORNING SNACK (11 AM):
  - [Detailed with portions]
  - Calories: __ kcal

• LUNCH (1-2 PM):
  - [Detailed with portions]
  - Calories: __ kcal
  - Cooking Method: [Explain]

• EVENING SNACK (5 PM):
  - [Detailed with portions]
  - Calories: __ kcal

• DINNER (7-8 PM):
  - [Detailed with portions]
  - Calories: __ kcal
  - Cooking Instructions: [Step-by-step]

[Repeat this EXACT format for TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY]

3. WEEKLY GROCERY SHOPPING LIST (Quantities for 7 days)
   VEGETABLES:
   • [Vegetable Name]: __ grams
   • [Vegetable Name]: __ grams
   
   FRUITS:
   • [Fruit Name]: __ pieces/grams
   
   PROTEINS:
   • [Protein Source]: __ grams
   
   CARBS:
   • [Carb Source]: __ grams
   
   DAIRY:
   • [Dairy Item]: __ liters/grams
   
   FATS & OILS:
   • [Oil/Butter]: __ ml/grams
   
   SPICES & CONDIMENTS

4. MEAL PREP GUIDE
   • Sunday Prep Schedule
   • Storage Instructions
   • Reheating Guidelines
   • Portion Control Tips

5. NUTRITION TIPS FOR ${goal.toUpperCase()}
   • Best foods for ${goal}
   • Foods to avoid
   • Timing of meals
   • Hydration tips
   • Supplement suggestions (if needed)

6. ADJUSTMENT GUIDELINES
   • How to increase/decrease calories
   • Vegetarian alternatives
   • Budget-friendly swaps
   • Quick meal ideas

IMPORTANT: Provide ALL sections with DETAILED information. Include exact measurements, cooking times, and practical advice. Make it beginner-friendly.`;

      console.log('Sending request to Gemini API...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: dietPrompt }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 4000,
              topP: 0.9,
              topK: 40
            }
          }),
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error Text:', errorText);
        
        let errorMessage = `API error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch (e) {
          // If not JSON, use text as is
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      
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
      } else if (data.error) {
        throw new Error(data.error.message || 'No response from AI');
      } else {
        console.error('Unexpected API response:', data);
        throw new Error('Unexpected response format from AI');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      setLastError(error.message);
      
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ **API Error**\n\nI couldn't generate your diet plan due to the following issue:\n\n**${error.message}**\n\n**Troubleshooting Steps:**\n1. Check your internet connection\n2. Verify API key in .env file\n3. Ensure Gemini API is enabled in Google Cloud Console\n4. Check API quota/limits\n\n**API Key Status:** ${process.env.EXPO_PUBLIC_GEMINI_API_KEY ? 'Found' : 'Not found'}\n\nPlease try again or contact support.`,
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
  }, [messages, saveMessages, testApiConnection]);

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
    setLastError(null);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY) {
        throw new Error('API key not configured');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ 
                text: `You are a professional nutritionist and dietitian. Provide detailed, practical advice about diet, nutrition, and meal planning. Be specific with portion sizes, timing, and preparation methods.\n\nUser's question: ${message}` 
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API Error:', errorText);
        throw new Error(`Chat API error: ${response.status}`);
      }

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
      } else {
        throw new Error('No response text from AI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setLastError(error.message);
      
      const errorMessage = {
        role: 'assistant',
        content: `❌ **Connection Error**\n\nI'm having trouble connecting to the AI service.\n\n**Error:** ${error.message}\n\n**Please check:**\n• Internet connection\n• API key configuration\n• Try again in a moment`,
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
      lastError,
      generateDietPlan,
      sendMessage,
      clearMessages,
      loadMessages,
      testApiConnection,
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);
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
      
      console.log('API Key:', API_KEY ? 'Found' : 'Not found');
      
      if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
        throw new Error('API key not configured. Please add your Gemini API key in .env file');
      }

      // Create optimized prompt
      const dietPrompt = `Create a personalized diet plan for:
Age: ${age} years
Gender: ${gender}
Weight: ${weight} kg
Height: ${height} cm
BMI: ${bmi} (${bmiCategory})
Goal: ${goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'}
Medical Conditions: ${medicalConditions || 'None'}
Daily Calorie Target: ${targetCalories} calories

Provide a detailed 7-day meal plan with exact portion sizes, calorie counts, and practical advice.`;

      console.log('Sending request to Gemini API...');
      
      // Use gemini-pro model which is more reliable
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
              temperature: 0.7,
              maxOutputTokens: 2000,
              topP: 0.8,
              topK: 40
            }
          })
        }
      );

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response received');
      
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
        console.error('No text in response:', data);
        throw new Error('No response text from AI');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I couldn't generate your diet plan. 

Error: ${error.message}

Please check:
1. Your internet connection
2. API key in .env file (EXPO_PUBLIC_GEMINI_API_KEY=your_key_here)
3. Try again in a moment

To get an API key:
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to your .env file`,
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
                text: `You are a professional nutritionist and dietitian. Provide detailed, practical advice about diet, nutrition, and meal planning. Be specific with portion sizes, timing, and preparation methods.

User's question: ${message}` 
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
        throw new Error(`API error: ${response.status}`);
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
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `I'm having trouble responding. 

Error: ${error.message}

Please check your internet connection and try again.`,
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

export const useGemini = () => useContext(GeminiContext);r
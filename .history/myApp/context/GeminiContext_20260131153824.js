// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(true);

  // Save messages
  const saveMessages = useCallback(async (msgs) => {
    try {
      await SecureStore.setItemAsync('diet_planner_messages', JSON.stringify(msgs));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, []);

  // Load messages
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

  // Clear messages
  const clearMessages = useCallback(async () => {
    setMessages([]);
    try {
      await SecureStore.deleteItemAsync('diet_planner_messages');
    } catch (error) {
      console.error('Error clearing messages:', error);
    }
  }, []);

  // Check API Key
  const checkApiKey = () => {
    const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    
    if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
      setApiKeyValid(false);
      throw new Error('Please add your new API key to .env file');
    }
    
    // Check if it's a valid Google API key format
    if (!API_KEY.startsWith('AIza')) {
      console.warn('API Key format may be incorrect');
    }
    
    return API_KEY;
  };

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
    
    const tdee = bmr * 1.55;
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
      content: `Create a diet plan for: ${age}yo ${gender}, ${weight}kg, ${height}cm, Goal: ${goal}`,
      timestamp: new Date().toISOString(),
      type: 'diet_request'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Check API key
      const API_KEY = checkApiKey();
      console.log('Using NEW API Key:', API_KEY.substring(0, 15) + '...');
      
      // Simple prompt
      const dietPrompt = `Create a diet plan for:
Age: ${age}
Gender: ${gender}  
Weight: ${weight}kg
Height: ${height}cm
Goal: ${goal}
BMI: ${bmi}
Calories: ${targetCalories}/day

Provide a simple 3-day meal plan with Indian food options.`;

      // Use gemini-1.0-pro model (more available in free tier)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
              maxOutputTokens: 1000,
              topP: 0.8
            }
          })
        }
      );

      console.log('API Response Status:', response.status);

      if (response.status === 429) {
        throw new Error('Daily limit reached. New key has 60 requests/day.');
      }

      if (response.status === 400) {
        throw new Error('Invalid API key. Please check your new key.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
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
        setApiKeyValid(true);
        return aiMessage;
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Error:', error);
      setApiKeyValid(false);
      
      let errorContent = '';
      
      if (error.message.includes('Invalid API key')) {
        errorContent = `🔐 **Invalid API Key**\n\nYour new API key may be incorrect.\n\n**Please verify:**\n1. Copy exact key from Google AI Studio\n2. Paste in .env file\n3. Restart app: expo start -c\n\nKey should look like: AIzaSyD...`;
      } else if (error.message.includes('Daily limit')) {
        errorContent = `📊 **New Key Active!**\n\nYour new API key is working!\n\n**Free Tier Limits:**\n• 60 requests per day\n• 15 requests per minute\n\n**Tips:**\n• Use app moderately\n• Wait between requests\n• New quota starts daily`;
      } else {
        errorContent = `⚠️ **Error**\n\n${error.message}\n\nPlease try again.`;
      }

      const errorMessage = {
        role: 'assistant',
        content: errorContent,
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

  // Send message
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
      const API_KEY = checkApiKey();
      
      // Add 2-second delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: `Nutrition advice: ${message}` }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
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
          type: 'chat'
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await saveMessages(finalMessages);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I'm having issues. ${error.message}`,
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
      apiKeyValid,
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
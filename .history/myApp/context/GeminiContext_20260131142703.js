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
              temperature: 0.8,
              maxOutputTokens: 4000, // Increased tokens
              topP: 0.9,
              topK: 40
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', errorText);
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
        console.error('No text in response:', data);
        throw new Error('No response text from AI');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I couldn't generate your diet plan. Please check:\n\n• Your internet connection\n• API key configuration\n• Try again in a moment\n\nError details: ${error.message}`,
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
        content: "I'm having trouble responding. Please check your internet connection and try again.",
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
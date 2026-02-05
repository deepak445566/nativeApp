// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Send message to Gemini
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    // Add user message immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY) {
        throw new Error('Please add your Gemini API key to .env file');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ 
                  text: `You are an expert nutritionist and diet planner. Create personalized diet plans based on user information. Be practical, helpful, and encouraging.

User request: ${message}

Provide a comprehensive diet plan with:
1. Daily calorie target
2. Meal suggestions
3. Food recommendations
4. Sample meal plan
5. Tips for success

Format it nicely with clear sections.` 
                }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble generating your diet plan right now. Please check your internet connection and try again. If the problem persists, make sure your API key is correctly configured.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load conversation (simple version)
  const loadConversation = useCallback(() => {
    // For now, just return empty
    // You can implement AsyncStorage here if needed
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <GeminiContext.Provider value={{
      messages,
      loading,
      sendMessage,
      clearConversation,
      loadConversation,
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);
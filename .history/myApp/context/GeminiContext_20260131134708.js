// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load conversation history
  const loadConversation = useCallback(async () => {
    try {
      const savedHistory = await SecureStore.getItemAsync('gemini_chat_history');
      const today = new Date().toDateString();
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (history[today]) {
          setMessages(history[today]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  // Save conversation
  const saveConversation = useCallback(async (newMessages) => {
    try {
      const today = new Date().toDateString();
      const savedHistory = await SecureStore.getItemAsync('gemini_chat_history');
      const history = savedHistory ? JSON.parse(savedHistory) : {};
      
      history[today] = newMessages;
      await SecureStore.setItemAsync('gemini_chat_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, []);

  // Send message to Gemini
  const sendMessage = useCallback(async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
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
        `?key=${API_KEY}`,
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
                  text: `You are an expert fitness and nutrition assistant. Provide helpful, practical advice. Be motivational and clear.

User: ${message}` 
                }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, aiMessage];
        setMessages(finalMessages);
        await saveConversation(finalMessages);
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } finally {
      setLoading(false);
    }
  }, [messages, saveConversation]);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    setMessages([]);
    try {
      await SecureStore.deleteItemAsync('gemini_chat_history');
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
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
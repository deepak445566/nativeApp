// context/GeminiContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Save conversation history
  const saveConversation = useCallback(async (newMessages) => {
    try {
      const today = new Date().toDateString();
      const savedHistory = await SecureStore.getItemAsync('gemini_chat_history');
      const history = savedHistory ? JSON.parse(savedHistory) : {};
      
      if (!history[today]) {
        history[today] = [];
      }
      
      history[today].push(...newMessages.slice(-10)); // Save last 10 messages
      await SecureStore.setItemAsync('gemini_chat_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, []);

  // Load conversation history
  const loadConversation = useCallback(async () => {
    try {
      const savedHistory = await SecureStore.getItemAsync('gemini_chat_history');
      const today = new Date().toDateString();
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (history[today]) {
          setConversationHistory(history[today]);
          setMessages(history[today]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
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

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `You are a fitness and health assistant. Help users with their fitness journey. Be supportive and motivational.

                User's message: ${message}` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, aiMessage]);
        saveConversation([userMessage, aiMessage]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [saveConversation]);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    setMessages([]);
    setConversationHistory([]);
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
// context/GeminiContext.js (Fixed)
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Load conversation history on app start
  const loadConversation = useCallback(async () => {
    try {
      const savedHistory = await SecureStore.getItemAsync('gemini_chat_history');
      const today = new Date().toDateString();
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (history[today]) {
          setMessages(history[today]);
          setConversationHistory(history[today]);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, []);

  // Save conversation history
  const saveConversation = useCallback(async (newMessage) => {
    try {
      const today = new Date().toDateString();
      const savedHistory = await SecureStore.getItemAsync('gemini_chat_history');
      const history = savedHistory ? JSON.parse(savedHistory) : {};
      
      if (!history[today]) {
        history[today] = [];
      }
      
      history[today].push(newMessage);
      
      // Keep only last 20 messages
      if (history[today].length > 20) {
        history[today] = history[today].slice(-20);
      }
      
      await SecureStore.setItemAsync('gemini_chat_history', JSON.stringify(history));
      setConversationHistory(history[today]);
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
      id: Date.now().toString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      
      if (!API_KEY) {
        throw new Error('API key not found. Please check your .env file');
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
                  text: `You are an expert fitness and nutrition assistant. Help users with their fitness journey. Be supportive, motivational, and provide practical advice. Keep responses concise and helpful.

User's question: ${message}` 
                }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
              topP: 0.8,
              topK: 40
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response Error:', errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
          id: (Date.now() + 1).toString()
        };

        setMessages(prev => [...prev, aiMessage]);
        // Save both messages
        await saveConversation(userMessage);
        await saveConversation(aiMessage);
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error('No valid response from AI');
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      const errorMessage = {
        role: 'assistant',
        content: `I apologize, but I'm having trouble connecting right now. Please check your internet connection and try again. Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        id: (Date.now() + 2).toString()
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
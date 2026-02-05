import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import * as SecureStore from "expo-secure-store";

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(true);

  /* -------------------- STORAGE -------------------- */

  const saveMessages = async (msgs) => {
    try {
      await SecureStore.setItemAsync(
        "diet_planner_messages",
        JSON.stringify(msgs)
      );
    } catch (e) {
      console.log("Save error:", e);
    }
  };

  const loadMessages = async () => {
    try {
      const saved = await SecureStore.getItemAsync("diet_planner_messages");
      if (saved) setMessages(JSON.parse(saved));
    } catch (e) {
      console.log("Load error:", e);
    }
  };

  const clearMessages = async () => {
    setMessages([]);
    await SecureStore.deleteItemAsync("diet_planner_messages");
  };

  useEffect(() => {
    loadMessages();
  }, []);

  /* -------------------- API KEY CHECK -------------------- */

  const checkApiKey = () => {
    const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!API_KEY) {
      setApiKeyValid(false);
      throw new Error("API key missing");
    }

    if (!API_KEY.startsWith("AIza")) {
      console.warn("API key format may be incorrect");
    }

    return API_KEY;
  };

  /* -------------------- DIET PLAN (STRICT) -------------------- */

  const generateDietPlan = useCallback(async (userData) => {
    const { age, gender, weight, height, goal } = userData;

    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    const bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const tdee = Math.round(bmr * 1.55);
    const calories =
      goal === "weight_loss"
        ? Math.round(tdee * 0.85)
        : Math.round(tdee * 1.15);

    const userMessage = {
      role: "user",
      content: "Generate my diet plan",
      timestamp: new Date().toISOString(),
      type: "diet_request",
    };

    // 🔥 IMPORTANT: old chat NOT included
    setMessages([userMessage]);
    setLoading(true);

    try {
      const API_KEY = checkApiKey();

    const prompt = `
You are a professional Indian dietitian.

STRICT RULES:
- No explanations
- No tips
- No greetings
- No extra text
- ONLY diet content

User Details:
Age: ${age}
Gender: ${gender}
Weight: ${weight} kg
Height: ${height} cm
BMI: ${bmi}
Goal: ${goal}
Calories: ${calories}

FORMAT (EXACT):

NEUTRAL DAILY DIET PLAN:

Breakfast:
- 

Lunch:
- 

Evening Snack:
- 

Dinner:
- 

AVOID:
- 

Use ONLY simple Indian food.
`;


      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error ${response.status}`);
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) throw new Error("No response");

      const aiMessage = {
        role: "assistant",
        content: text,
        timestamp: new Date().toISOString(),
        type: "diet_plan",
      };

      const finalMessages = [userMessage, aiMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setApiKeyValid(true);

      return aiMessage;
    } catch (err) {
      setApiKeyValid(false);

      const errorMessage = {
        role: "assistant",
        content: `❌ ${err.message}`,
        timestamp: new Date().toISOString(),
        type: "error",
      };

      setMessages([userMessage, errorMessage]);
      saveMessages([userMessage, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------------------- NORMAL CHAT -------------------- */

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      type: "chat",
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setLoading(true);

    try {
      const API_KEY = checkApiKey();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text }],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!reply) return;

      const aiMessage = {
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
        type: "chat",
      };

      const final = [...updated, aiMessage];
      setMessages(final);
      saveMessages(final);
    } catch (e) {
      console.log("Chat error:", e);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  /* -------------------- PROVIDER -------------------- */

  return (
    <GeminiContext.Provider
      value={{
        messages,
        loading,
        apiKeyValid,
        generateDietPlan,
        sendMessage,
        clearMessages,
        loadMessages,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);

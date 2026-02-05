import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";

const GeminiContext = createContext();

export const GeminiProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- API KEY ---------------- */

  const getApiKey = () => {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!key) throw new Error("API key missing");
    return key;
  };

  /* ---------------- DIET PLAN ---------------- */

  const generateDietPlan = useCallback(async (user) => {
    const { age, gender, weight, height, goal } = user;

    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    const bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const calories =
      goal === "weight_loss"
        ? Math.round(bmr * 1.4 * 0.85)
        : Math.round(bmr * 1.4 * 1.15);

    setLoading(true);

    try {
      const prompt = `
RETURN ONLY VALID JSON. NO TEXT.

SCHEMA:
{
 "day1": {
  "breakfast": "",
  "lunch": "",
  "snack": "",
  "dinner": ""
 },
 "day2": {
  "breakfast": "",
  "lunch": "",
  "snack": "",
  "dinner": ""
 },
 "day3": {
  "breakfast": "",
  "lunch": "",
  "snack": "",
  "dinner": ""
 }
}

RULES:
- Indian food only
- Full meals
- No explanations
- Do NOT shorten
- If response cuts, CONTINUE

DATA:
Age: ${age}
Gender: ${gender}
Weight: ${weight}kg
Height: ${height}cm
BMI: ${bmi}
Calories: ${calories}
Goal: ${goal}
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${getApiKey()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              topP: 0.5,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      const data = await res.json();
      const raw =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!raw) throw new Error("Empty response");

      const plan = JSON.parse(raw); // 💥 THIS FORCES COMPLETE DATA

      const formatted = `
DAY 1
Breakfast: ${plan.day1.breakfast}
Lunch: ${plan.day1.lunch}
Snack: ${plan.day1.snack}
Dinner: ${plan.day1.dinner}

DAY 2
Breakfast: ${plan.day2.breakfast}
Lunch: ${plan.day2.lunch}
Snack: ${plan.day2.snack}
Dinner: ${plan.day2.dinner}

DAY 3
Breakfast: ${plan.day3.breakfast}
Lunch: ${plan.day3.lunch}
Snack: ${plan.day3.snack}
Dinner: ${plan.day3.dinner}
`;

      const finalMessages = [
        {
          role: "assistant",
          type: "diet_plan",
          content: formatted,
          timestamp: new Date().toISOString(),
        },
      ];

      setMessages(finalMessages);
      await SecureStore.setItemAsync(
        "diet_planner_messages",
        JSON.stringify(finalMessages)
      );

      return formatted;
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <GeminiContext.Provider
      value={{
        messages,
        loading,
        generateDietPlan,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);

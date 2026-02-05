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

const analyzeInjury = useCallback(async (injuryData) => {
  const { imageBase64, symptoms, description, painLevel, severity } = injuryData;
  
  const userMessage = {
    role: "user",
    content: "Analyze my injury",
    timestamp: new Date().toISOString(),
    type: "injury_request",
  };

  setLoading(true);

  try {
    const API_KEY = checkApiKey();

    // Construct prompt for Gemini AI
    const prompt = `
ACT AS A PROFESSIONAL MEDICAL FIRST AID ASSISTANT AND SPORTS INJURY SPECIALIST.

USER INJURY REPORT:
${description ? `Injury Description: ${description}` : "No description provided"}
Selected Symptoms: ${symptoms.join(", ") || "None selected"}
Pain Level: ${painLevel}/10
Severity Rating: ${severity}/10
${imageBase64 ? "An image of the injury has been uploaded." : "No image provided."}

IMPORTANT INSTRUCTIONS:
1. Provide TEMPORARY solutions only
2. Focus on FIRST AID measures
3. Be SPECIFIC about when to see a doctor
4. Use simple, clear language
5. Consider this is for home/self-care until medical help

ANALYZE AND PROVIDE:
1. **Likely Injury Type**: What type of injury could this be?
2. **Urgency Level**: Emergency/High/Medium/Low
3. **Immediate First Aid Steps**: 5 specific steps
4. **What to Avoid**: 3-5 things NOT to do
5. **Doctor Visit Timeline**: When exactly to seek medical help
6. **Pain Relief Options**: Safe temporary pain management
7. **Recovery Expectations**: Timeline with self-care

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

🔍 **LIKELY INJURY**: [Brief injury type]

⚠️ **URGENCY LEVEL**: [Emergency/High/Medium/Low]

🩹 **IMMEDIATE FIRST AID**:
1. [Step 1 - be specific]
2. [Step 2 - be specific]
3. [Step 3 - be specific]
4. [Step 4 - be specific]
5. [Step 5 - be specific]

❌ **AVOID THESE**:
- [Thing 1 to avoid]
- [Thing 2 to avoid]
- [Thing 3 to avoid]
- [Thing 4 to avoid]

🏥 **SEE DOCTOR IF**:
- [Condition 1 - be specific]
- [Condition 2 - be specific]
- [Condition 3 - be specific]
- [Time frame if no improvement]

💊 **PAIN MANAGEMENT**:
- [Option 1]
- [Option 2]
- [Option 3]

📅 **RECOVERY TIMELINE**:
- [First 24 hours expectations]
- [Next 3 days]
- [1 week mark]
- [Full recovery estimate]

⚠️ **WARNING**: This is for informational purposes only. Always consult a healthcare professional for proper diagnosis.
`;

    // If image is provided, include it in the request
    const contents = imageBase64 ? 
      [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ] : 
      [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 40,
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
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.log("API Error:", errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from AI");
    }

    const aiMessage = {
      role: "assistant",
      content: text,
      timestamp: new Date().toISOString(),
      type: "injury_analysis",
      rawData: injuryData,
    };

    const finalMessages = [...messages, userMessage, aiMessage];
    setMessages(finalMessages);
    saveMessages(finalMessages);
    setApiKeyValid(true);

    return {
      success: true,
      analysis: text,
      parsed: parseInjuryResponse(text),
    };

  } catch (err) {
    console.log("Injury analysis error:", err);
    
    const errorMessage = {
      role: "assistant",
      content: `❌ Analysis Failed: ${err.message}\n\nPlease try again or consult a healthcare professional immediately.`,
      timestamp: new Date().toISOString(),
      type: "error",
    };

    const final = [...messages, userMessage, errorMessage];
    setMessages(final);
    saveMessages(final);
    
    return {
      success: false,
      error: err.message,
    };
  } finally {
    setLoading(false);
  }
}, [messages]);

/* -------------------- PARSE INJURY RESPONSE -------------------- */

const parseInjuryResponse = (text) => {
  const sections = {
    injury: "",
    urgency: "",
    firstAid: [],
    avoid: [],
    seeDoctor: [],
    painManagement: [],
    recovery: [],
  };

  const lines = text.split('\n');
  let currentSection = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('**LIKELY INJURY**') || trimmed.includes('**POSSIBLE INJURY**')) {
      currentSection = 'injury';
      sections.injury = trimmed.split(':**')[1]?.trim() || "";
    } else if (trimmed.includes('**URGENCY LEVEL**')) {
      currentSection = 'urgency';
      sections.urgency = trimmed.split(':**')[1]?.trim() || "";
    } else if (trimmed.includes('**IMMEDIATE FIRST AID**')) {
      currentSection = 'firstAid';
    } else if (trimmed.includes('**AVOID THESE**')) {
      currentSection = 'avoid';
    } else if (trimmed.includes('**SEE DOCTOR IF**')) {
      currentSection = 'seeDoctor';
    } else if (trimmed.includes('**PAIN MANAGEMENT**')) {
      currentSection = 'painManagement';
    } else if (trimmed.includes('**RECOVERY TIMELINE**')) {
      currentSection = 'recovery';
    } else if (currentSection && trimmed) {
      // Extract list items
      const listMatch = trimmed.match(/^[0-9•\-\.]\s*(.+)/);
      if (listMatch) {
        sections[currentSection].push(listMatch[1].trim());
      } else if (!trimmed.includes('**') && trimmed.length > 10) {
        // For non-list content in injury section
        if (currentSection === 'injury' && !sections.injury) {
          sections.injury = trimmed;
        }
      }
    }
  });

  return sections;
};



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
        analyzeInjury, // Add this
      parseInjuryResponse,
      }}
    >
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => useContext(GeminiContext);

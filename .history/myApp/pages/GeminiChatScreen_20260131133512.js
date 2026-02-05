// screens/GeminiChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Modal
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGemini } from "../context/GeminiContext";

export default function GeminiChatScreen({ navigation }) {
  const { messages, loading, sendMessage, clearConversation } = useGemini();
  const [chatInput, setChatInput] = useState("");
  const [showDietForm, setShowDietForm] = useState(false);
  const [dietFormData, setDietFormData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "weight_loss",
    dietaryPreferences: "",
    allergies: "",
    medicalConditions: ""
  });
  const [formStep, setFormStep] = useState(1);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const flatListRef = useRef(null);

  // Activity levels
  const activityLevels = [
    { id: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
    { id: "light", label: "Light", desc: "Light exercise 1-3 days/week" },
    { id: "moderate", label: "Moderate", desc: "Moderate exercise 3-5 days/week" },
    { id: "active", label: "Active", desc: "Hard exercise 6-7 days/week" },
    { id: "very_active", label: "Very Active", desc: "Very hard exercise & physical job" }
  ];

  // Fitness goals
  const fitnessGoals = [
    { id: "weight_loss", label: "Weight Loss", icon: "trending-down" },
    { id: "weight_gain", label: "Weight Gain", icon: "trending-up" },
    { id: "muscle_building", label: "Muscle Building", icon: "fitness-center" },
    { id: "maintenance", label: "Maintenance", icon: "balance" },
    { id: "toning", label: "Body Toning", icon: "accessibility" }
  ];

  // Dietary preferences
  const dietaryPreferences = [
    { id: "vegetarian", label: "Vegetarian" },
    { id: "vegan", label: "Vegan" },
    { id: "non_vegetarian", label: "Non-Vegetarian" },
    { id: "pescatarian", label: "Pescatarian" },
    { id: "gluten_free", label: "Gluten-Free" },
    { id: "lactose_free", label: "Lactose-Free" }
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "AI Diet Planner",
      headerStyle: {
        backgroundColor: '#7C3AED',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 15 }}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity 
          onPress={clearConversation}
          style={{ marginRight: 15 }}
        >
          <Icon name="delete" size={24} color="white" />
        </TouchableOpacity>
      ),
    });

    // Auto-start diet planning if no messages
    if (messages.length === 0) {
      startDietPlanning();
    }
  }, [navigation]);

  const startDietPlanning = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: "🍎 Welcome to AI Diet Planner! I'll help you create a personalized diet plan. First, I need some information about you. Click 'Start Diet Planning' below to begin!",
      timestamp: new Date().toISOString(),
    };
    sendMessage(welcomeMessage);
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleStartDietPlanning = () => {
    setShowDietForm(true);
    const dietStartMessage = {
      role: 'assistant',
      content: "Great! Let's start by gathering some information about you. This will help me create a personalized diet plan. Please fill out the form.",
      timestamp: new Date().toISOString(),
    };
    sendMessage(dietStartMessage);
  };

  const handleDietFormChange = (field, value) => {
    setDietFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBMI = () => {
    if (dietFormData.weight && dietFormData.height) {
      const heightInMeters = parseFloat(dietFormData.height) / 100;
      return (parseFloat(dietFormData.weight) / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const calculateDailyCalories = () => {
    if (!dietFormData.weight || !dietFormData.height || !dietFormData.age || !dietFormData.gender) return null;

    const weight = parseFloat(dietFormData.weight);
    const height = parseFloat(dietFormData.height);
    const age = parseInt(dietFormData.age);
    
    // BMR calculation (Mifflin-St Jeor Equation)
    let bmr;
    if (dietFormData.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[dietFormData.activityLevel];

    // Adjust based on goal
    const goalAdjustments = {
      weight_loss: tdee * 0.85, // 15% deficit
      weight_gain: tdee * 1.15, // 15% surplus
      muscle_building: tdee * 1.1, // 10% surplus
      maintenance: tdee,
      toning: tdee * 0.9 // 10% deficit
    };

    return Math.round(goalAdjustments[dietFormData.goal] || tdee);
  };

  const generateDietPlan = async () => {
    setIsGeneratingPlan(true);
    
    const bmi = calculateBMI();
    const dailyCalories = calculateDailyCalories();
    
    const dietPrompt = `Create a personalized diet plan with the following details:
    
    User Profile:
    - Weight: ${dietFormData.weight} kg
    - Height: ${dietFormData.height} cm
    - Age: ${dietFormData.age} years
    - Gender: ${dietFormData.gender}
    - Activity Level: ${dietFormData.activityLevel}
    - Goal: ${dietFormData.goal}
    - Dietary Preferences: ${dietFormData.dietaryPreferences}
    - Allergies: ${dietFormData.allergies || 'None'}
    - Medical Conditions: ${dietFormData.medicalConditions || 'None'}
    
    Calculations:
    - BMI: ${bmi || 'Not calculated'}
    - Daily Calorie Target: ${dailyCalories || 'Not calculated'} calories
    
    Please provide a comprehensive diet plan including:
    1. Daily calorie distribution (breakfast, lunch, dinner, snacks)
    2. Macronutrient breakdown (carbs, protein, fat percentages)
    3. Meal suggestions for each time of day
    4. Foods to include and avoid
    5. Hydration recommendations
    6. Sample 7-day meal plan
    7. Tips for achieving the goal: ${dietFormData.goal}
    
    Make it practical, easy to follow, and include portion sizes.`;

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
                parts: [{ text: dietPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2000,
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.candidates && data.candidates[0]) {
        const dietPlanMessage = {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
          timestamp: new Date().toISOString(),
        };

        sendMessage(dietPlanMessage);
        setShowDietForm(false);
        setIsGeneratingPlan(false);
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating your diet plan. Please try again.',
        timestamp: new Date().toISOString(),
      };
      sendMessage(errorMessage);
      setIsGeneratingPlan(false);
    }
  };

  const nextFormStep = () => {
    if (formStep < 4) {
      setFormStep(formStep + 1);
    } else {
      generateDietPlan();
    }
  };

  const prevFormStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const renderFormStep = () => {
    switch(formStep) {
      case 1:
        return (
          <View style={styles.formStep}>
            <Text style={styles.formStepTitle}>Personal Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)*</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={dietFormData.weight}
                onChangeText={(value) => handleDietFormChange('weight', value)}
                placeholder="Enter your weight"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)*</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={dietFormData.height}
                onChangeText={(value) => handleDietFormChange('height', value)}
                placeholder="Enter your height"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age*</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={dietFormData.age}
                onChangeText={(value) => handleDietFormChange('age', value)}
                placeholder="Enter your age"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender*</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    dietFormData.gender === 'male' && styles.genderButtonActive
                  ]}
                  onPress={() => handleDietFormChange('gender', 'male')}
                >
                  <Icon name="male" size={20} color={dietFormData.gender === 'male' ? 'white' : '#64748B'} />
                  <Text style={[
                    styles.genderButtonText,
                    dietFormData.gender === 'male' && styles.genderButtonTextActive
                  ]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    dietFormData.gender === 'female' && styles.genderButtonActive
                  ]}
                  onPress={() => handleDietFormChange('gender', 'female')}
                >
                  <Icon name="female" size={20} color={dietFormData.gender === 'female' ? 'white' : '#64748B'} />
                  <Text style={[
                    styles.genderButtonText,
                    dietFormData.gender === 'female' && styles.genderButtonTextActive
                  ]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.formStep}>
            <Text style={styles.formStepTitle}>Activity & Goals</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activity Level*</Text>
              <ScrollView style={styles.activityScroll}>
                {activityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.activityButton,
                      dietFormData.activityLevel === level.id && styles.activityButtonActive
                    ]}
                    onPress={() => handleDietFormChange('activityLevel', level.id)}
                  >
                    <View>
                      <Text style={[
                        styles.activityButtonText,
                        dietFormData.activityLevel === level.id && styles.activityButtonTextActive
                      ]}>{level.label}</Text>
                      <Text style={styles.activityButtonDesc}>{level.desc}</Text>
                    </View>
                    {dietFormData.activityLevel === level.id && (
                      <Icon name="check-circle" size={20} color="#7C3AED" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fitness Goal*</Text>
              <View style={styles.goalsGrid}>
                {fitnessGoals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalButton,
                      dietFormData.goal === goal.id && styles.goalButtonActive
                    ]}
                    onPress={() => handleDietFormChange('goal', goal.id)}
                  >
                    <Icon 
                      name={goal.icon} 
                      size={24} 
                      color={dietFormData.goal === goal.id ? 'white' : '#7C3AED'} 
                    />
                    <Text style={[
                      styles.goalButtonText,
                      dietFormData.goal === goal.id && styles.goalButtonTextActive
                    ]}>{goal.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.formStep}>
            <Text style={styles.formStepTitle}>Dietary Preferences</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dietary Preference*</Text>
              <View style={styles.preferencesGrid}>
                {dietaryPreferences.map((pref) => (
                  <TouchableOpacity
                    key={pref.id}
                    style={[
                      styles.preferenceButton,
                      dietFormData.dietaryPreferences === pref.id && styles.preferenceButtonActive
                    ]}
                    onPress={() => handleDietFormChange('dietaryPreferences', pref.id)}
                  >
                    <Text style={[
                      styles.preferenceButtonText,
                      dietFormData.dietaryPreferences === pref.id && styles.preferenceButtonTextActive
                    ]}>{pref.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Food Allergies (Optional)</Text>
              <TextInput
                style={styles.input}
                value={dietFormData.allergies}
                onChangeText={(value) => handleDietFormChange('allergies', value)}
                placeholder="E.g., nuts, dairy, gluten"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medical Conditions (Optional)</Text>
              <TextInput
                style={styles.input}
                value={dietFormData.medicalConditions}
                onChangeText={(value) => handleDietFormChange('medicalConditions', value)}
                placeholder="E.g., diabetes, hypertension"
              />
            </View>
          </View>
        );

      case 4:
        const bmi = calculateBMI();
        const calories = calculateDailyCalories();
        
        return (
          <View style={styles.formStep}>
            <Text style={styles.formStepTitle}>Review & Generate</Text>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Icon name="assessment" size={24} color="#7C3AED" />
                <Text style={styles.summaryTitle}>Your Profile Summary</Text>
              </View>
              
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Weight</Text>
                  <Text style={styles.summaryValue}>{dietFormData.weight} kg</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Height</Text>
                  <Text style={styles.summaryValue}>{dietFormData.height} cm</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Age</Text>
                  <Text style={styles.summaryValue}>{dietFormData.age} yrs</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Gender</Text>
                  <Text style={styles.summaryValue}>{dietFormData.gender}</Text>
                </View>
              </View>

              <View style={styles.resultCard}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Calculated BMI</Text>
                  <Text style={styles.resultValue}>{bmi || "N/A"}</Text>
                </View>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Daily Calories</Text>
                  <Text style={styles.resultValue}>{calories || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                  <Icon name="directions-run" size={16} color="#64748B" />
                  <Text style={styles.detailText}>Activity: {activityLevels.find(l => l.id === dietFormData.activityLevel)?.label}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Icon name="flag" size={16} color="#64748B" />
                  <Text style={styles.detailText}>Goal: {fitnessGoals.find(g => g.id === dietFormData.goal)?.label}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Icon name="restaurant" size={16} color="#64748B" />
                  <Text style={styles.detailText}>Diet: {dietaryPreferences.find(p => p.id === dietFormData.dietaryPreferences)?.label}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.noteText}>
              Click "Generate Diet Plan" to create your personalized nutrition plan based on this information.
            </Text>
          </View>
        );
    }
  };

  const renderFormProgress = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(formStep / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {formStep} of 4</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      
      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="restaurant" size={28} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Diet Planner</Text>
            <Text style={styles.headerSubtitle}>Personalized Nutrition Plans</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages Container */}
      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIcon}>
              <Icon name="restaurant-menu" size={60} color="#7C3AED" />
            </View>
            <Text style={styles.welcomeTitle}>🍎 AI Diet Planner</Text>
            <Text style={styles.welcomeText}>
              Get a personalized diet plan tailored to your body type, goals, and preferences. 
              I'll create a complete nutrition plan just for you!
            </Text>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartDietPlanning}
            >
              <Icon name="play-arrow" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Diet Planning</Text>
            </TouchableOpacity>

            <Text style={styles.featuresTitle}>What you'll get:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Personalized meal plans</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Calorie & macro breakdown</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>7-day sample meal plan</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Food recommendations</Text>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[
                styles.messageBubble,
                item.role === 'user' ? styles.userMessage : styles.aiMessage
              ]}>
                <View style={[
                  styles.messageAvatar,
                  item.role === 'user' ? styles.userAvatar : styles.aiAvatar
                ]}>
                  <Icon 
                    name={item.role === 'user' ? 'person' : 'restaurant-menu'} 
                    size={18} 
                    color="white" 
                  />
                </View>
                <View style={styles.messageContent}>
                  <Text style={[
                    styles.messageText,
                    item.role === 'user' ? styles.userText : styles.aiText
                  ]}>
                    {item.content}
                  </Text>
                  <Text style={styles.messageTime}>
                    {new Date(item.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Input Container */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask about your diet plan or nutrition..."
            placeholderTextColor="#94a3b8"
            value={chatInput}
            onChangeText={setChatInput}
            multiline
            maxLength={500}
            onSubmitEditing={handleSendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!chatInput.trim() || loading) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!chatInput.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
        {chatInput.length > 0 && (
          <Text style={styles.charCount}>
            {chatInput.length}/500
          </Text>
        )}
      </KeyboardAvoidingView>

      {/* Diet Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDietForm}
        onRequestClose={() => setShowDietForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Create Diet Plan</Text>
                <TouchableOpacity onPress={() => setShowDietForm(false)}>
                  <Icon name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              {renderFormProgress()}
            </LinearGradient>

            <ScrollView style={styles.modalContent}>
              {renderFormStep()}
            </ScrollView>

            <View style={styles.modalFooter}>
              {formStep > 1 && (
                <TouchableOpacity 
                  style={styles.prevButton}
                  onPress={prevFormStep}
                >
                  <Icon name="arrow-back" size={20} color="#7C3AED" />
                  <Text style={styles.prevButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={nextFormStep}
                disabled={
                  (formStep === 1 && (!dietFormData.weight || !dietFormData.height || !dietFormData.age)) ||
                  (formStep === 2 && (!dietFormData.activityLevel || !dietFormData.goal)) ||
                  (formStep === 3 && !dietFormData.dietaryPreferences) ||
                  isGeneratingPlan
                }
              >
                {isGeneratingPlan ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {formStep === 4 ? 'Generate Diet Plan' : 'Next'}
                    </Text>
                    <Icon name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
  },
  messagesList: {
    paddingVertical: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  userAvatar: {
    backgroundColor: '#7C3AED',
  },
  aiAvatar: {
    backgroundColor: '#10B981',
  },
  messageContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: '85%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
  },
  aiText: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'right',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  chatInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 6,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    maxHeight: 500,
    padding: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  // Progress Bar
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Form Styles
  formStep: {
    marginBottom: 20,
  },
  formStepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  genderButtonTextActive: {
    color: 'white',
  },
  activityScroll: {
    maxHeight: 200,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  activityButtonActive: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  activityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  activityButtonTextActive: {
    color: '#7C3AED',
  },
  activityButtonDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  goalButton: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  goalButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  goalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  goalButtonTextActive: {
    color: 'white',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  preferenceButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  preferenceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  preferenceButtonTextActive: {
    color: 'white',
  },
  // Summary Styles
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultItem: {
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  detailsSection: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Buttons
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 8,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    marginLeft: 12,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 8,
  },
});
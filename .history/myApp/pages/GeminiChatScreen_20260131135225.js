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
  StatusBar,
  ActivityIndicator,
  Modal
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGemini } from "../context/GeminiContext";

export default function GeminiChatScreen({ navigation }) {
  const { messages, loading, sendMessage, clearConversation, loadConversation } = useGemini();
  const [chatInput, setChatInput] = useState("");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [userData, setUserData] = useState({
    weight: "",
    height: "",
    age: "",
    gender: "male",
    goal: "weight_loss",
    medicalConditions: ""
  });
  const flatListRef = useRef(null);

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

    // Load saved conversation
    loadConversation();

    // Start conversation if no messages
    if (messages.length === 0) {
      setTimeout(() => {
        startConversation();
      }, 1000);
    }
  }, [navigation]);

  const startConversation = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: "🍎 Hi! I'm your AI Diet Planner. I'll create a personalized diet plan for you. First, I need some basic information. Tap the button below to start!",
      timestamp: new Date().toISOString(),
    };
    
    // Check if welcome message already exists
    const hasWelcomeMessage = messages.some(msg => 
      msg.role === 'assistant' && msg.content.includes('AI Diet Planner')
    );
    
    if (!hasWelcomeMessage) {
      sendMessage(welcomeMessage.content);
    }
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const handleStartQuestions = () => {
    setShowQuestionModal(true);
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBMI = () => {
    if (userData.weight && userData.height) {
      const heightInMeters = parseFloat(userData.height) / 100;
      return (parseFloat(userData.weight) / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const generateDietPlan = () => {
    const bmi = calculateBMI();
    
    const dietPrompt = `Create a personalized diet plan for me based on this information:
    
    My Details:
    - Age: ${userData.age} years
    - Gender: ${userData.gender}
    - Weight: ${userData.weight} kg
    - Height: ${userData.height} cm
    - Goal: ${userData.goal === 'weight_loss' ? 'Weight Loss' : 'Weight Gain'}
    - Medical Conditions: ${userData.medicalConditions || 'None'}
    
    Calculations:
    - BMI: ${bmi || 'Not calculated'}
    
    Please provide a complete diet plan including:
    1. Daily calorie target
    2. Meal timing and frequency
    3. Food recommendations
    4. Sample meal plan for a week
    5. Foods to avoid
    6. Tips for ${userData.goal === 'weight_loss' ? 'losing weight' : 'gaining weight'}
    
    Make it practical and easy to follow.`;

    sendMessage(dietPrompt);
    setShowQuestionModal(false);
    resetForm();
  };

  const resetForm = () => {
    setUserData({
      weight: "",
      height: "",
      age: "",
      gender: "male",
      goal: "weight_loss",
      medicalConditions: ""
    });
  };

  const isFormComplete = () => {
    return userData.weight && userData.height && userData.age;
  };

  return (
    <View style={styles.container}>
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
            <Text style={styles.headerSubtitle}>Get Personalized Nutrition</Text>
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
            <Text style={styles.welcomeTitle}>🍏 Personalized Diet Plans</Text>
            <Text style={styles.welcomeText}>
              Answer a few quick questions and I'll create a customized diet plan tailored just for you!
            </Text>
            
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartQuestions}
            >
              <Icon name="play-arrow" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Now</Text>
            </TouchableOpacity>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.benefitText}>Takes only 2 minutes</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.benefitText}>100% personalized</Text>
              </View>
              <View style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.benefitText}>Easy to follow plans</Text>
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
            placeholder="Ask about nutrition or diet..."
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
      </KeyboardAvoidingView>

      {/* Quick Question Button */}
      {messages.length > 0 && (
        <TouchableOpacity
          style={styles.quickQuestionButton}
          onPress={handleStartQuestions}
        >
          <Icon name="add-circle" size={24} color="white" />
          <Text style={styles.quickQuestionText}>Create New Diet Plan</Text>
        </TouchableOpacity>
      )}

      {/* Question Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQuestionModal}
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Your Details</Text>
                <TouchableOpacity onPress={() => setShowQuestionModal(false)}>
                  <Icon name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>
                Please provide your basic information for a personalized diet plan
              </Text>

              <View style={styles.formContainer}>
                {/* Age */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Age (years)*</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={userData.age}
                    onChangeText={(value) => handleInputChange('age', value)}
                    placeholder="Enter your age"
                  />
                </View>

                {/* Gender */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender*</Text>
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        userData.gender === 'male' && styles.genderButtonActive
                      ]}
                      onPress={() => handleInputChange('gender', 'male')}
                    >
                      <Icon name="male" size={20} color={userData.gender === 'male' ? 'white' : '#64748B'} />
                      <Text style={[
                        styles.genderButtonText,
                        userData.gender === 'male' && styles.genderButtonTextActive
                      ]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        userData.gender === 'female' && styles.genderButtonActive
                      ]}
                      onPress={() => handleInputChange('gender', 'female')}
                    >
                      <Icon name="female" size={20} color={userData.gender === 'female' ? 'white' : '#64748B'} />
                      <Text style={[
                        styles.genderButtonText,
                        userData.gender === 'female' && styles.genderButtonTextActive
                      ]}>Female</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight & Height */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Weight (kg)*</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={userData.weight}
                      onChangeText={(value) => handleInputChange('weight', value)}
                      placeholder="Weight"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Height (cm)*</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={userData.height}
                      onChangeText={(value) => handleInputChange('height', value)}
                      placeholder="Height"
                    />
                  </View>
                </View>

                {/* Goal */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Your Goal*</Text>
                  <View style={styles.goalContainer}>
                    <TouchableOpacity
                      style={[
                        styles.goalButton,
                        userData.goal === 'weight_loss' && styles.goalButtonActive
                      ]}
                      onPress={() => handleInputChange('goal', 'weight_loss')}
                    >
                      <Icon 
                        name="trending-down" 
                        size={24} 
                        color={userData.goal === 'weight_loss' ? 'white' : '#7C3AED'} 
                      />
                      <Text style={[
                        styles.goalButtonText,
                        userData.goal === 'weight_loss' && styles.goalButtonTextActive
                      ]}>Weight Loss</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.goalButton,
                        userData.goal === 'weight_gain' && styles.goalButtonActive
                      ]}
                      onPress={() => handleInputChange('goal', 'weight_gain')}
                    >
                      <Icon 
                        name="trending-up" 
                        size={24} 
                        color={userData.goal === 'weight_gain' ? 'white' : '#7C3AED'} 
                      />
                      <Text style={[
                        styles.goalButtonText,
                        userData.goal === 'weight_gain' && styles.goalButtonTextActive
                      ]}>Weight Gain</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Medical Conditions */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Medical Conditions (Optional)</Text>
                  <TextInput
                    style={[styles.input, { height: 80 }]}
                    value={userData.medicalConditions}
                    onChangeText={(value) => handleInputChange('medicalConditions', value)}
                    placeholder="E.g., diabetes, hypertension, thyroid, etc."
                    multiline
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.generateButton,
                  !isFormComplete() && styles.generateButtonDisabled
                ]}
                onPress={generateDietPlan}
                disabled={!isFormComplete() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="restaurant-menu" size={20} color="white" />
                    <Text style={styles.generateButtonText}>Generate Diet Plan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  benefitsContainer: {
    width: '100%',
    marginTop: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  benefitText: {
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  quickQuestionButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickQuestionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 24,
    maxHeight: 500,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  goalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  goalButton: {
    flex: 1,
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
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
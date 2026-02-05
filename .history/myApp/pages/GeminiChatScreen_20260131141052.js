// screens/GeminiChatScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGemini } from "../context/GeminiContext";

const { width, height } = Dimensions.get('window');

export default function GeminiChatScreen({ navigation }) {
  const { messages, loading, generateDietPlan, sendMessage, clearMessages, loadMessages } = useGemini();
  const [chatInput, setChatInput] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [userData, setUserData] = useState({
    age: "",
    gender: "male",
    weight: "",
    height: "",
    goal: "weight_loss",
    medicalConditions: ""
  });
  const scrollViewRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "AI Diet Planner",
      headerStyle: { backgroundColor: '#7C3AED' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleClear} style={{ marginRight: 15 }}>
          <Icon name="delete" size={24} color="white" />
        </TouchableOpacity>
      ),
    });

    loadMessages();
  }, [navigation]);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages]);

  const handleClear = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", onPress: clearMessages, style: "destructive" }
      ]
    );
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput("");
    }
  };

  const handleInputChange = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { age, weight, height } = userData;
    
    if (!age || !weight || !height) {
      Alert.alert("Required Fields", "Please fill Age, Weight, and Height");
      return false;
    }

    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (ageNum < 10 || ageNum > 100) {
      Alert.alert("Invalid Age", "Please enter age between 10-100 years");
      return false;
    }

    if (weightNum < 20 || weightNum > 300) {
      Alert.alert("Invalid Weight", "Please enter weight between 20-300 kg");
      return false;
    }

    if (heightNum < 100 || heightNum > 250) {
      Alert.alert("Invalid Height", "Please enter height between 100-250 cm");
      return false;
    }

    return true;
  };

  const handleGeneratePlan = async () => {
    if (!validateForm()) return;
    
    setShowForm(false);
    
    try {
      await generateDietPlan({
        age: userData.age,
        gender: userData.gender,
        weight: userData.weight,
        height: userData.height,
        goal: userData.goal,
        medicalConditions: userData.medicalConditions || "None"
      });
      
      // Reset form
      setUserData({
        age: "",
        gender: "male",
        weight: "",
        height: "",
        goal: "weight_loss",
        medicalConditions: ""
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate diet plan. Please try again.");
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isDietPlan = message.type === 'diet_plan';
    
    return (
      <View 
        key={index} 
        style={[
          styles.messageContainer,
          isUser ? styles.userContainer : styles.aiContainer
        ]}
      >
        <View style={[
          styles.avatar,
          isUser ? styles.userAvatar : styles.aiAvatar
        ]}>
          <Icon 
            name={isUser ? "person" : "restaurant-menu"} 
            size={18} 
            color="white" 
          />
        </View>
        
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
          isDietPlan && styles.dietPlanBubble
        ]}>
          {isDietPlan ? (
            <View style={styles.dietPlanWrapper}>
              <View style={styles.dietPlanHeader}>
                <Icon name="restaurant-menu" size={22} color="#7C3AED" />
                <Text style={styles.dietPlanTitle}>🎯 Your Personalized Diet Plan</Text>
              </View>
              <ScrollView 
                style={styles.dietPlanScroll}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Text style={styles.dietPlanText}>
                  {message.content}
                </Text>
              </ScrollView>
              <View style={styles.dietPlanFooter}>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={[
                styles.messageText,
                isUser ? styles.userText : styles.aiText
              ]}>
                {message.content}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />
      
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="restaurant" size={28} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Diet Planner</Text>
            <Text style={styles.headerSubtitle}>Get Your Custom Diet Plan</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages Area - Using ScrollView instead of FlatList */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="restaurant-menu" size={70} color="#7C3AED" />
            </View>
            <Text style={styles.emptyTitle}>🍎 Create Your Diet Plan</Text>
            <Text style={styles.emptyText}>
              Answer a few simple questions and get a complete personalized diet plan tailored just for you!
            </Text>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => setShowForm(true)}
              activeOpacity={0.8}
            >
              <Icon name="play-arrow" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Now</Text>
            </TouchableOpacity>
            
            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <Icon name="fitness-center" size={26} color="#7C3AED" />
                <Text style={styles.featureTitle}>Custom Plans</Text>
                <Text style={styles.featureDesc}>Tailored to your body</Text>
              </View>
              <View style={styles.featureCard}>
                <Icon name="schedule" size={26} color="#7C3AED" />
                <Text style={styles.featureTitle}>7-Day Menu</Text>
                <Text style={styles.featureDesc}>Complete meal schedule</Text>
              </View>
              <View style={styles.featureCard}>
                <Icon name="local-fire-department" size={26} color="#7C3AED" />
                <Text style={styles.featureTitle}>Calorie Count</Text>
                <Text style={styles.featureDesc}>Accurate calculations</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.loadingText}>Creating your diet plan...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputArea}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ask about nutrition or diet..."
            placeholderTextColor="#94a3b8"
            value={chatInput}
            onChangeText={setChatInput}
            multiline
            maxLength={1000}
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
              <Icon name="send" size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* New Plan Button */}
      {messages.length > 0 && (
        <TouchableOpacity 
          style={styles.newPlanButton} 
          onPress={() => setShowForm(true)}
          activeOpacity={0.8}
        >
          <Icon name="add-circle" size={24} color="white" />
          <Text style={styles.newPlanText}>New Diet Plan</Text>
        </TouchableOpacity>
      )}

      {/* Diet Form Modal */}
      <Modal 
        visible={showForm} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <LinearGradient colors={['#7C3AED', '#5B21B6']} style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Create Diet Plan</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Icon name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>Tell us about yourself</Text>
            </LinearGradient>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent}>
              <View style={styles.form}>
                {/* Age */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Age (years)*</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={userData.age}
                    onChangeText={(value) => handleInputChange('age', value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 25"
                  />
                </View>

                {/* Gender */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Gender*</Text>
                  <View style={styles.genderOptions}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        userData.gender === 'male' && styles.genderActive
                      ]}
                      onPress={() => handleInputChange('gender', 'male')}
                      activeOpacity={0.8}
                    >
                      <Icon name="male" size={22} color={userData.gender === 'male' ? 'white' : '#64748B'} />
                      <Text style={[
                        styles.genderText,
                        userData.gender === 'male' && styles.genderTextActive
                      ]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        userData.gender === 'female' && styles.genderActive
                      ]}
                      onPress={() => handleInputChange('gender', 'female')}
                      activeOpacity={0.8}
                    >
                      <Icon name="female" size={22} color={userData.gender === 'female' ? 'white' : '#64748B'} />
                      <Text style={[
                        styles.genderText,
                        userData.gender === 'female' && styles.genderTextActive
                      ]}>
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight & Height */}
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Weight (kg)*</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={userData.weight}
                      onChangeText={(value) => handleInputChange('weight', value.replace(/[^0-9.]/g, ''))}
                      placeholder="e.g., 70"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                    <Text style={styles.label}>Height (cm)*</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={userData.height}
                      onChangeText={(value) => handleInputChange('height', value.replace(/[^0-9.]/g, ''))}
                      placeholder="e.g., 175"
                    />
                  </View>
                </View>

                {/* Goal */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Your Goal*</Text>
                  <View style={styles.goalOptions}>
                    <TouchableOpacity
                      style={[
                        styles.goalButton,
                        userData.goal === 'weight_loss' && styles.goalActive
                      ]}
                      onPress={() => handleInputChange('goal', 'weight_loss')}
                      activeOpacity={0.8}
                    >
                      <Icon 
                        name="trending-down" 
                        size={24} 
                        color={userData.goal === 'weight_loss' ? 'white' : '#7C3AED'} 
                      />
                      <Text style={[
                        styles.goalText,
                        userData.goal === 'weight_loss' && styles.goalTextActive
                      ]}>
                        Lose Weight
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.goalButton,
                        userData.goal === 'weight_gain' && styles.goalActive
                      ]}
                      onPress={() => handleInputChange('goal', 'weight_gain')}
                      activeOpacity={0.8}
                    >
                      <Icon 
                        name="trending-up" 
                        size={24} 
                        color={userData.goal === 'weight_gain' ? 'white' : '#7C3AED'} 
                      />
                      <Text style={[
                        styles.goalText,
                        userData.goal === 'weight_gain' && styles.goalTextActive
                      ]}>
                        Gain Weight
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Medical Conditions */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Medical Conditions (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]}
                    value={userData.medicalConditions}
                    onChangeText={(value) => handleInputChange('medicalConditions', value)}
                    placeholder="e.g., diabetes, hypertension, thyroid, etc."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.generateButton,
                  (!userData.age || !userData.weight || !userData.height) && styles.generateDisabled
                ]}
                onPress={handleGeneratePlan}
                disabled={!userData.age || !userData.weight || !userData.height || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="restaurant-menu" size={22} color="white" />
                    <Text style={styles.generateText}>Generate Diet Plan</Text>
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
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    marginTop: 4,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space at bottom
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: height * 0.6,
  },
  emptyIcon: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 28,
    marginBottom: 32,
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  startButtonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: width * 0.28,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 10,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  userAvatar: {
    backgroundColor: '#7C3AED',
    marginLeft: 8,
  },
  aiAvatar: {
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '85%',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 6,
    padding: 16,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    padding: 18,
  },
  dietPlanBubble: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    minHeight: 300,
    maxHeight: 500,
  },
  dietPlanWrapper: {
    width: width * 0.85 - 36,
  },
  dietPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dietPlanTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
    flex: 1,
  },
  dietPlanScroll: {
    maxHeight: 380,
    marginBottom: 12,
  },
  dietPlanText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  dietPlanFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'right',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  inputArea: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 120,
    paddingVertical: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  newPlanButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  newPlanText: {
    color: 'white',
    fontSize: 15,
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
    maxHeight: height * 0.9,
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
    marginBottom: 12,
  },
  modalTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContent: {
    padding: 24,
    maxHeight: height * 0.6,
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 14,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  genderActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  genderText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#64748B',
  },
  genderTextActive: {
    color: 'white',
  },
  goalOptions: {
    flexDirection: 'row',
    gap: 14,
  },
  goalButton: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  goalActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 10,
    textAlign: 'center',
  },
  goalTextActive: {
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
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  generateDisabled: {
    backgroundColor: '#CBD5E1',
  },
  generateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 14,
  },
});
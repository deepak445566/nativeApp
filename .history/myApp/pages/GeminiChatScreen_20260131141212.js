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
  Modal,
  Alert,
  ScrollView
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGemini } from "../context/GeminiContext";

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
  const flatListRef = useRef(null);

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
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
      
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 500);
    } catch (error) {
      Alert.alert("Error", "Failed to generate diet plan. Please try again.");
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const isDietPlan = item.type === 'diet_plan';
    
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.aiAvatar]}>
          <Icon name={isUser ? "person" : "restaurant-menu"} size={16} color="white" />
        </View>
        
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {isDietPlan ? (
            <View style={styles.dietPlanContainer}>
              <View style={styles.dietPlanHeader}>
                <Icon name="restaurant-menu" size={20} color="#7C3AED" />
                <Text style={styles.dietPlanTitle}>Your Personalized Diet Plan</Text>
              </View>
              <ScrollView style={styles.dietPlanContent}>
                <Text style={styles.dietPlanText}>{item.content}</Text>
                
              </ScrollView>
              <View style={styles.dietPlanFooter}>
                <Text style={styles.dietPlanTime}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                {item.content}
              </Text>
              <Text style={styles.messageTime}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* Messages Area */}
      <View style={styles.messagesArea}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Icon name="restaurant-menu" size={60} color="#7C3AED" />
            </View>
            <Text style={styles.emptyTitle}>Create Your Diet Plan</Text>
            <Text style={styles.emptyText}>
              Answer a few questions and get a personalized diet plan tailored just for you!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={() => setShowForm(true)}>
              <Icon name="play-arrow" size={24} color="white" />
              <Text style={styles.startButtonText}>Start Now</Text>
            </TouchableOpacity>
            
            <View style={styles.features}>
              <View style={styles.feature}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Personalized meal plans</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>7-day sample menu</Text>
              </View>
              <View style={styles.feature}>
                <Icon name="check-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Expert nutrition advice</Text>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
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
            style={[styles.sendButton, (!chatInput.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!chatInput.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* New Plan Button */}
      {messages.length > 0 && (
        <TouchableOpacity style={styles.newPlanButton} onPress={() => setShowForm(true)}>
          <Icon name="add-circle" size={22} color="white" />
          <Text style={styles.newPlanText}>New Diet Plan</Text>
        </TouchableOpacity>
      )}

      {/* Diet Form Modal */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
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
            </LinearGradient>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>Tell us about yourself</Text>
              
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
                      style={[styles.genderButton, userData.gender === 'male' && styles.genderActive]}
                      onPress={() => handleInputChange('gender', 'male')}
                    >
                      <Icon name="male" size={20} color={userData.gender === 'male' ? 'white' : '#64748B'} />
                      <Text style={[styles.genderText, userData.gender === 'male' && styles.genderTextActive]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.genderButton, userData.gender === 'female' && styles.genderActive]}
                      onPress={() => handleInputChange('gender', 'female')}
                    >
                      <Icon name="female" size={20} color={userData.gender === 'female' ? 'white' : '#64748B'} />
                      <Text style={[styles.genderText, userData.gender === 'female' && styles.genderTextActive]}>
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
                      style={[styles.goalButton, userData.goal === 'weight_loss' && styles.goalActive]}
                      onPress={() => handleInputChange('goal', 'weight_loss')}
                    >
                      <Icon 
                        name="trending-down" 
                        size={22} 
                        color={userData.goal === 'weight_loss' ? 'white' : '#7C3AED'} 
                      />
                      <Text style={[styles.goalText, userData.goal === 'weight_loss' && styles.goalTextActive]}>
                        Lose Weight
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.goalButton, userData.goal === 'weight_gain' && styles.goalActive]}
                      onPress={() => handleInputChange('goal', 'weight_gain')}
                    >
                      <Icon 
                        name="trending-up" 
                        size={22} 
                        color={userData.goal === 'weight_gain' ? 'white' : '#7C3AED'} 
                      />
                      <Text style={[styles.goalText, userData.goal === 'weight_gain' && styles.goalTextActive]}>
                        Gain Weight
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Medical Conditions */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Medical Conditions (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, { height: 80 }]}
                    value={userData.medicalConditions}
                    onChangeText={(value) => handleInputChange('medicalConditions', value)}
                    placeholder="e.g., diabetes, hypertension, thyroid"
                    multiline
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.generateButton, (!userData.age || !userData.weight || !userData.height) && styles.generateDisabled]}
                onPress={handleGeneratePlan}
                disabled={!userData.age || !userData.weight || !userData.height || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="restaurant-menu" size={20} color="white" />
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
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  emptyText: {
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
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  features: {
    width: '100%',
    marginTop: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 15,
    color: '#64748B',
    marginLeft: 10,
  },
  messagesList: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    maxWidth: '80%',
    borderRadius: 20,
    padding: 16,
  },
  userBubble: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dietPlanContainer: {
    width: '100%',
  },
  dietPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dietPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 10,
  },
  dietPlanContent: {
    maxHeight: 500,
    marginBottom: 12,
  },
  dietPlanText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  dietPlanFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  dietPlanTime: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'right',
  },
  inputArea: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  newPlanButton: {
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
  newPlanText: {
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
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
  },
  genderOptions: {
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
  genderActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  genderTextActive: {
    color: 'white',
  },
  goalOptions: {
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
  goalActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
  },
  generateDisabled: {
    backgroundColor: '#CBD5E1',
  },
  generateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});
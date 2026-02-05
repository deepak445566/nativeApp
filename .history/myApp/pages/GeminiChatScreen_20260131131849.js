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
  ActivityIndicator
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGemini } from "../context/GeminiContext";

export default function GeminiChatScreen({ navigation }) {
  const { messages, loading, sendMessage, clearConversation } = useGemini();
  const [chatInput, setChatInput] = useState("");
  const flatListRef = useRef(null);

  // Quick questions for fitness advice
  const quickQuestions = [
    "Best workout for beginners?",
    "How to lose weight?",
    "Healthy diet tips",
    "Motivation for exercise",
    "How to build muscle?",
    "Best cardio exercises"
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Fitness AI Assistant",
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
  }, [navigation]);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput("");
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickQuestion = (question) => {
    setChatInput(question);
    handleSendMessage();
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
            <Icon name="smart-toy" size={28} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Fitness AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Powered by Gemini AI</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages Container */}
      <View style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIcon}>
              <Icon name="fitness-center" size={60} color="#7C3AED" />
            </View>
            <Text style={styles.welcomeTitle}>Welcome to Your Fitness Assistant! 🤖</Text>
            <Text style={styles.welcomeText}>
              I'm here to help you with workouts, nutrition, and fitness tips. 
              Ask me anything about your fitness journey!
            </Text>
            
            {/* Quick Questions */}
            <View style={styles.quickQuestionsContainer}>
              <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
              <View style={styles.quickQuestionsGrid}>
                {quickQuestions.map((question, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickQuestion}
                    onPress={() => handleQuickQuestion(question)}
                  >
                    <Text style={styles.quickQuestionText}>{question}</Text>
                  </TouchableOpacity>
                ))}
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
                    name={item.role === 'user' ? 'person' : 'smart-toy'} 
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
            placeholder="Ask about fitness, workouts, or nutrition..."
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
  quickQuestionsContainer: {
    width: '100%',
  },
  quickQuestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickQuestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickQuestion: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
    width: '48%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    textAlign: 'center',
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
});
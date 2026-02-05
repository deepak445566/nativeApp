import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  TextInput,
  Linking,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import { useGemini } from "../context/GeminiContext";
import Slider from "@react-native-community/slider";

const { width } = Dimensions.get("window");

export default function InjuryPredictor({ navigation }) {
  const { sendMessage } = useGemini();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [severity, setSeverity] = useState(5);
  const [painLevel, setPainLevel] = useState(5);
  const [showResults, setShowResults] = useState(false);

  const symptomsList = [
    "Pain during movement",
    "Swelling",
    "Bruising",
    "Redness",
    "Limited range of motion",
    "Numbness",
    "Tingling sensation",
    "Weakness",
    "Popping sound",
    "Instability",
    "Stiffness",
    "Warm to touch",
  ];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera roll access is required to upload photos",
        [{ text: "OK" }]
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera access is required to take photos",
        [{ text: "OK" }]
      );
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const toggleSymptom = (symptom) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const analyzeInjury = async () => {
    if (!image && symptoms.length === 0 && !description.trim()) {
      Alert.alert("Missing Information", "Please provide at least one of: photo, symptoms, or description");
      return;
    }

    setLoading(true);
    setShowResults(false);

    try {
      let base64Image = "";
      if (image) {
        const base64 = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Image = base64;
      }

      // Construct the prompt for Gemini
      const prompt = `
ACT AS A MEDICAL FIRST AID ASSISTANT AND INJURY ANALYST.

USER INJURY INFORMATION:
${description ? `Description: ${description}` : "No description provided"}
Symptoms: ${symptoms.join(", ") || "No specific symptoms"}
Pain Level: ${painLevel}/10
Severity: ${severity}/10

${image ? "I have uploaded an image of the injury." : "No image provided"}

ANALYSIS REQUEST:
1. **Possible Injury Type**: Based on the information, what type of injury could this be?
2. **Urgency Level**: Rate as Low/Medium/High/Emergency
3. **Immediate First Aid Steps**: Provide 3-5 temporary measures
4. **What to Avoid**: List things NOT to do
5. **When to See Doctor**: Clear timeline for professional help
6. **Pain Management**: Safe temporary pain relief options
7. **Recovery Timeline**: Estimated recovery with self-care

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

🔍 **POSSIBLE INJURY**: [Your analysis]

⚠️ **URGENCY LEVEL**: [Low/Medium/High/Emergency]

🩹 **IMMEDIATE FIRST AID**:
1. 
2. 
3. 
4. 
5. 

❌ **AVOID THESE**:
- 
- 
- 

🏥 **SEE DOCTOR IF**:
- 
- 
- 

💊 **PAIN MANAGEMENT**:
- 
- 
- 

📅 **RECOVERY TIMELINE**:
- 
`;

      const response = await sendMessage(prompt);
      
      if (response && response.content) {
        const aiMessage = response.content;
        const parsedResult = parseAIResponse(aiMessage);
        setPrediction(parsedResult);
        setShowResults(true);
      } else {
        throw new Error("No response from AI");
      }

    } catch (error) {
      Alert.alert("Analysis Failed", error.message || "Failed to analyze injury");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const parseAIResponse = (text) => {
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
      if (line.includes('**POSSIBLE INJURY**')) {
        currentSection = 'injury';
        sections.injury = line.split(':**')[1]?.trim() || "";
      } else if (line.includes('**URGENCY LEVEL**')) {
        currentSection = 'urgency';
        sections.urgency = line.split(':**')[1]?.trim() || "";
      } else if (line.includes('**IMMEDIATE FIRST AID**')) {
        currentSection = 'firstAid';
      } else if (line.includes('**AVOID THESE**')) {
        currentSection = 'avoid';
      } else if (line.includes('**SEE DOCTOR IF**')) {
        currentSection = 'seeDoctor';
      } else if (line.includes('**PAIN MANAGEMENT**')) {
        currentSection = 'painManagement';
      } else if (line.includes('**RECOVERY TIMELINE**')) {
        currentSection = 'recovery';
      } else if (line.trim() && currentSection && line.trim().match(/^[0-9•\-]/)) {
        const content = line.replace(/^[0-9•\-\.\s]+/, '').trim();
        if (content) {
          sections[currentSection].push(content);
        }
      }
    });

    return sections;
  };

  const clearAll = () => {
    setImage(null);
    setSymptoms([]);
    setDescription("");
    setSeverity(5);
    setPainLevel(5);
    setPrediction(null);
    setShowResults(false);
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency?.toLowerCase()) {
      case 'emergency': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const callEmergency = () => {
    Linking.openURL('tel:112');
  };

  const findNearbyHospitals = () => {
    Linking.openURL('https://www.google.com/maps/search/hospital+near+me');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF4757']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Injury Predictor</Text>
            <Text style={styles.headerSubtitle}>AI-Powered Injury Analysis</Text>
          </View>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={callEmergency}
          >
            <Icon name="emergency" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Injury Photo</Text>
          <Text style={styles.sectionSubtitle}>
            Take a clear photo or upload from gallery
          </Text>
          
          <View style={styles.uploadButtons}>
            <TouchableOpacity 
              style={[styles.uploadButton, styles.cameraButton]}
              onPress={takePhoto}
            >
              <Icon name="camera-alt" size={28} color="#FF6B6B" />
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.uploadButton, styles.galleryButton]}
              onPress={pickImage}
            >
              <Icon name="photo-library" size={28} color="#3B82F6" />
              <Text style={styles.uploadButtonText}>From Gallery</Text>
            </TouchableOpacity>
          </View>

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <Icon name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe Your Injury</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe how it happened, location, and sensations..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Symptoms</Text>
          <View style={styles.symptomsContainer}>
            {symptomsList.map((symptom, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.symptomChip,
                  symptoms.includes(symptom) && styles.symptomChipSelected
                ]}
                onPress={() => toggleSymptom(symptom)}
              >
                <Text style={[
                  styles.symptomText,
                  symptoms.includes(symptom) && styles.symptomTextSelected
                ]}>
                  {symptom}
                </Text>
                {symptoms.includes(symptom) && (
                  <Icon name="check" size={16} color="white" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pain & Severity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pain & Severity Level</Text>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Pain Level</Text>
              <Text style={styles.sliderValue}>{painLevel}/10</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={painLevel}
              onValueChange={setPainLevel}
              minimumTrackTintColor="#EF4444"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#EF4444"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Mild</Text>
              <Text style={styles.sliderMaxLabel}>Severe</Text>
            </View>
          </View>

          <View style={[styles.sliderContainer, { marginTop: 24 }]}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>Injury Severity</Text>
              <Text style={styles.sliderValue}>{severity}/10</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={severity}
              onValueChange={setSeverity}
              minimumTrackTintColor="#F59E0B"
              maximumTrackTintColor="#E5E7EB"
              thumbTintColor="#F59E0B"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinLabel}>Minor</Text>
              <Text style={styles.sliderMaxLabel}>Critical</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearButton]}
            onPress={clearAll}
          >
            <Icon name="delete" size={20} color="#6B7280" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.analyzeButton]}
            onPress={analyzeInjury}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="psychology" size={24} color="white" />
                <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {showResults && prediction && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>AI Analysis Results</Text>
              <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(prediction.urgency) }]}>
                <Text style={styles.urgencyText}>{prediction.urgency || "Analyzing..."}</Text>
              </View>
            </View>

            {prediction.injury && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Icon name="medical-services" size={20} color="#7C3AED" />
                  <Text style={styles.resultCardTitle}>Possible Injury</Text>
                </View>
                <Text style={styles.resultCardContent}>{prediction.injury}</Text>
              </View>
            )}

            {prediction.firstAid && prediction.firstAid.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Icon name="healing" size={20} color="#10B981" />
                  <Text style={styles.resultCardTitle}>Immediate First Aid</Text>
                </View>
                {prediction.firstAid.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {prediction.avoid && prediction.avoid.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Icon name="dangerous" size={20} color="#EF4444" />
                  <Text style={styles.resultCardTitle}>What to Avoid</Text>
                </View>
                {prediction.avoid.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {prediction.seeDoctor && prediction.seeDoctor.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <Icon name="local-hospital" size={20} color="#3B82F6" />
                  <Text style={styles.resultCardTitle}>When to See a Doctor</Text>
                </View>
                {prediction.seeDoctor.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Emergency Actions */}
            {(prediction.urgency?.toLowerCase() === 'emergency' || severity >= 8) && (
              <View style={[styles.resultCard, styles.emergencyCard]}>
                <View style={styles.resultCardHeader}>
                  <Icon name="warning" size={24} color="#EF4444" />
                  <Text style={[styles.resultCardTitle, { color: '#EF4444' }]}>
                    ⚠️ Emergency Action Required
                  </Text>
                </View>
                <Text style={styles.emergencyText}>
                  Based on your symptoms, this may be a serious injury requiring immediate medical attention.
                </Text>
                <View style={styles.emergencyButtons}>
                  <TouchableOpacity 
                    style={[styles.emergencyButton, styles.callButton]}
                    onPress={callEmergency}
                  >
                    <Icon name="call" size={20} color="white" />
                    <Text style={styles.emergencyButtonText}>Call Emergency</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.emergencyButton, styles.hospitalButton]}
                    onPress={findNearbyHospitals}
                  >
                    <Icon name="place" size={20} color="white" />
                    <Text style={styles.emergencyButtonText}>Find Hospitals</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Icon name="info" size={20} color="#6B7280" />
              <Text style={styles.disclaimerText}>
                This is an AI-powered analysis for informational purposes only. Always consult a healthcare professional for proper diagnosis and treatment.
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Analyzing your injury...</Text>
            <Text style={styles.loadingSubtext}>Please wait while AI processes the information</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  emergencyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 28,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cameraButton: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  galleryButton: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  symptomChipSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  symptomText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  symptomTextSelected: {
    color: 'white',
  },
  checkIcon: {
    marginLeft: 6,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  analyzeButton: {
    backgroundColor: '#7C3AED',
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  urgencyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  urgencyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  resultCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  resultCardContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  emergencyCard: {
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  emergencyText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  emergencyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#EF4444',
  },
  hospitalButton: {
    backgroundColor: '#3B82F6',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
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
  const { analyzeInjury, loading: aiLoading } = useGemini();
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [severity, setSeverity] = useState(5);
  const [painLevel, setPainLevel] = useState(5);
  const [showResults, setShowResults] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

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
    "Bleeding",
    "Difficulty walking",
    "Joint locking",
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

  const handleAnalyzeInjury = async () => {
    if (!image && symptoms.length === 0 && !description.trim()) {
      Alert.alert(
        "Missing Information", 
        "Please provide at least one of:\n• Upload a photo\n• Select symptoms\n• Describe your injury",
        [{ text: "OK" }]
      );
      return;
    }

    setLocalLoading(true);
    setShowResults(false);

    try {
      let base64Image = "";
      if (image) {
        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        base64Image = base64;
      }

      // Prepare injury data for Gemini AI
      const injuryData = {
        imageBase64: base64Image,
        symptoms,
        description: description.trim(),
        painLevel,
        severity,
        timestamp: new Date().toISOString(),
      };

      console.log("Sending to Gemini AI...");
      
      // Call Gemini AI for analysis
      const result = await analyzeInjury(injuryData);
      
      if (result.success) {
        console.log("AI Analysis Successful:", result.parsed);
        setPrediction(result.parsed);
        setShowResults(true);
        
        // Show success message
        Alert.alert(
          "Analysis Complete",
          "AI has analyzed your injury. Please review the recommendations below.",
          [{ text: "OK" }]
        );
      } else {
        throw new Error(result.error || "AI analysis failed");
      }

    } catch (error) {
      console.error("Injury analysis error:", error);
      Alert.alert(
        "Analysis Failed",
        error.message || "Unable to analyze injury. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const clearAll = () => {
    Alert.alert(
      "Clear All",
      "Are you sure you want to clear all inputs?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            setImage(null);
            setSymptoms([]);
            setDescription("");
            setSeverity(5);
            setPainLevel(5);
            setPrediction(null);
            setShowResults(false);
          }
        }
      ]
    );
  };

  const getUrgencyColor = (urgency) => {
    if (!urgency) return '#6B7280';
    
    const urgencyLower = urgency.toLowerCase();
    if (urgencyLower.includes('emergency')) return '#EF4444';
    if (urgencyLower.includes('high')) return '#F59E0B';
    if (urgencyLower.includes('medium')) return '#3B82F6';
    if (urgencyLower.includes('low')) return '#10B981';
    return '#6B7280';
  };

  const callEmergency = () => {
    Alert.alert(
      "Emergency Call",
      "Are you sure you want to call emergency services?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call Now", 
          style: "destructive",
          onPress: () => Linking.openURL('tel:112')
        }
      ]
    );
  };

  const findNearbyHospitals = () => {
    Linking.openURL('https://www.google.com/maps/search/hospital+emergency+near+me');
  };

  const getBodyPartSuggestions = () => {
    if (description.toLowerCase().includes('head')) return ['Head Injury', 'Concussion'];
    if (description.toLowerCase().includes('arm') || description.toLowerCase().includes('elbow')) 
      return ['Sprain', 'Fracture', 'Tendinitis'];
    if (description.toLowerCase().includes('leg') || description.toLowerCase().includes('knee'))
      return ['Sprain', 'Strain', 'Ligament Tear'];
    if (description.toLowerCase().includes('back')) return ['Muscle Strain', 'Disc Issue'];
    if (description.toLowerCase().includes('ankle')) return ['Sprain', 'Fracture'];
    return [];
  };

  const isLoading = localLoading || aiLoading;

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
            <Text style={styles.headerSubtitle}>AI-Powered Analysis & First Aid</Text>
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
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="info" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Gemini AI will analyze your injury and provide temporary first aid solutions
          </Text>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 Upload Injury Photo</Text>
          <Text style={styles.sectionSubtitle}>
            Clear photos help AI provide better analysis
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
              <Text style={styles.imageNote}>Photo ready for AI analysis</Text>
            </View>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✍️ Describe Your Injury</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Example: 'Fell while running, pain in right ankle, can't put weight on it'"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          {getBodyPartSuggestions().length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Common injuries for this area:</Text>
              <View style={styles.suggestionsChips}>
                {getBodyPartSuggestions().map((suggestion, index) => (
                  <View key={index} style={styles.suggestionChip}>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Symptoms Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>🤕 Select Symptoms</Text>
            <Text style={styles.symptomsCount}>
              {symptoms.length} selected
            </Text>
          </View>
          <View style={styles.symptomsContainer}>
            {symptomsList.map((symptom, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.symptomChip,
                  symptoms.includes(symptom) && styles.symptomChipSelected
                ]}
                onPress={() => toggleSymptom(symptom)}
                activeOpacity={0.7}
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
          <Text style={styles.sectionTitle}>📊 Pain & Severity Level</Text>
          
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <View style={styles.sliderLabelContainer}>
                <Icon name="sick" size={20} color="#EF4444" />
                <Text style={styles.sliderLabel}>Pain Level</Text>
              </View>
              <View style={styles.painIndicator}>
                {[...Array(10)].map((_, i) => (
                  <View 
                    key={i}
                    style={[
                      styles.painDot,
                      i < painLevel && styles.painDotActive,
                      { backgroundColor: i < painLevel ? '#EF4444' : '#E5E7EB' }
                    ]}
                  />
                ))}
                <Text style={styles.sliderValue}>{painLevel}/10</Text>
              </View>
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
              <View style={styles.sliderLabelContainer}>
                <Icon name="warning" size={20} color="#F59E0B" />
                <Text style={styles.sliderLabel}>Injury Severity</Text>
              </View>
              <View style={styles.severityIndicator}>
                <View style={[
                  styles.severityBar,
                  { 
                    width: `${severity * 10}%`,
                    backgroundColor: severity >= 8 ? '#EF4444' : 
                                   severity >= 5 ? '#F59E0B' : 
                                   severity >= 3 ? '#3B82F6' : '#10B981'
                  }
                ]} />
                <Text style={styles.sliderValue}>{severity}/10</Text>
              </View>
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
            disabled={isLoading}
          >
            <Icon name="delete" size={20} color="#6B7280" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.analyzeButton,
              isLoading && styles.analyzeButtonDisabled
            ]}
            onPress={handleAnalyzeInjury}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.analyzeButtonText}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Icon name="psychology" size={24} color="white" />
                <Text style={styles.analyzeButtonText}>Analyze with Gemini AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {showResults && prediction && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>🧠 Gemini AI Analysis</Text>
              {prediction.urgency && (
                <View style={[
                  styles.urgencyBadge, 
                  { backgroundColor: getUrgencyColor(prediction.urgency) }
                ]}>
                  <Icon name="warning" size={16} color="white" />
                  <Text style={styles.urgencyText}>{prediction.urgency}</Text>
                </View>
              )}
            </View>

            {prediction.injury && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#7C3AED20' }]}>
                    <Icon name="medical-services" size={20} color="#7C3AED" />
                  </View>
                  <Text style={styles.resultCardTitle}>Likely Injury Type</Text>
                </View>
                <Text style={styles.resultCardContent}>{prediction.injury}</Text>
              </View>
            )}

            {prediction.firstAid && prediction.firstAid.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                    <Icon name="healing" size={20} color="#10B981" />
                  </View>
                  <Text style={styles.resultCardTitle}>Immediate First Aid</Text>
                </View>
                {prediction.firstAid.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <View style={styles.numberBadge}>
                      <Text style={styles.numberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {prediction.avoid && prediction.avoid.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                    <Icon name="dangerous" size={20} color="#EF4444" />
                  </View>
                  <Text style={styles.resultCardTitle}>What to Avoid</Text>
                </View>
                {prediction.avoid.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="close" size={16} color="#EF4444" style={styles.avoidIcon} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {prediction.seeDoctor && prediction.seeDoctor.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                    <Icon name="local-hospital" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.resultCardTitle}>When to See a Doctor</Text>
                </View>
                {prediction.seeDoctor.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="schedule" size={16} color="#3B82F6" style={styles.doctorIcon} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {prediction.painManagement && prediction.painManagement.length > 0 && (
              <View style={styles.resultCard}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
                    <Icon name="medication" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.resultCardTitle}>Pain Management</Text>
                </View>
                {prediction.painManagement.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Icon name="check-circle" size={16} color="#10B981" style={styles.painIcon} />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Emergency Actions */}
            {(prediction.urgency?.toLowerCase().includes('emergency') || severity >= 8) && (
              <View style={[styles.resultCard, styles.emergencyCard]}>
                <View style={styles.resultCardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                    <Icon name="warning" size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.resultCardTitle, { color: '#EF4444' }]}>
                    ⚠️ Emergency Action Required
                  </Text>
                </View>
                <Text style={styles.emergencyText}>
                  Based on your symptoms and severity level ({severity}/10), this may require immediate medical attention.
                </Text>
                <View style={styles.emergencyButtons}>
                  <TouchableOpacity 
                    style={[styles.emergencyButton, styles.callButton]}
                    onPress={callEmergency}
                  >
                    <Icon name="call" size={20} color="white" />
                    <Text style={styles.emergencyButtonText}>Call Emergency (112)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.emergencyButton, styles.hospitalButton]}
                    onPress={findNearbyHospitals}
                  >
                    <Icon name="place" size={20} color="white" />
                    <Text style={styles.emergencyButtonText}>Find Nearby Hospitals</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Icon name="info" size={20} color="#6B7280" />
              <View style={styles.disclaimerContent}>
                <Text style={styles.disclaimerTitle}>Important Notice</Text>
                <Text style={styles.disclaimerText}>
                  This analysis is powered by Gemini AI for informational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or qualified healthcare provider with any questions you may have regarding a medical condition.
                </Text>
              </View>
            </View>

            {/* Save Report Button */}
            <TouchableOpacity style={styles.saveReportButton}>
              <Icon name="save" size={20} color="#7C3AED" />
              <Text style={styles.saveReportText}>Save This Report</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Gemini AI is analyzing your injury...</Text>
            <Text style={styles.loadingSubtext}>
              Processing {image ? "image and " : ""}symptoms...
            </Text>
            <View style={styles.loadingTips}>
              <Text style={styles.tipsTitle}>Tips while you wait:</Text>
              <Text style={styles.tipText}>• Keep the injured area elevated if swollen</Text>
              <Text style={styles.tipText}>• Apply ice wrapped in cloth (20 minutes on, 20 off)</Text>
              <Text style={styles.tipText}>• Avoid putting weight on the injured area</Text>
            </View>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symptomsCount: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
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
  imageNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
  suggestionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  sliderLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  painIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  painDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  painDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityBar: {
    height: 4,
    borderRadius: 2,
    width: 60,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'right',
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
  analyzeButtonDisabled: {
    opacity: 0.7,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  urgencyText: {
    color: 'white',
    fontSize: 12,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  numberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 22,
  },
  avoidIcon: {
    marginRight: 12,
    marginTop: 3,
  },
  doctorIcon: {
    marginRight: 12,
    marginTop: 3,
  },
  painIcon: {
    marginRight: 12,
    marginTop: 3,
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
    marginBottom: 16,
  },
  disclaimerContent: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  saveReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderRadius: 16,
    gap: 8,
    backgroundColor: 'white',
  },
  saveReportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
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
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingTips: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    marginLeft: 8,
  },
});
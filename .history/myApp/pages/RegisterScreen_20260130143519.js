import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";

export default function Register({ navigation }) {
  const { setIsLoggedIn } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Use the same IP address as login
  const API_BASE_URL = "http://192.168.0.115:5000";

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Validation Error", "Please enter a valid email");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const register = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log("Attempting registration...");
      
      const registerData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      };

   

      // First, try to register
      const registerRes = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(registerData),
      });

     

      const registerResult = await registerRes.json();
      console.log("Register response:", registerResult);

      if (!registerRes.ok) {
        throw new Error(registerResult.message || "Registration failed");
      }

      // If registration successful, automatically login
      console.log("Attempting auto login...");
      const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password: password 
        }),
      });

      console.log("Login response status:", loginRes.status);
      
      const loginData = await loginRes.json();
      console.log("Login response:", loginData);

      if (!loginRes.ok) {
        throw new Error(loginData.message || "Auto login failed");
      }

      if (loginData.token) {
        await AsyncStorage.setItem("token", loginData.token);
        await AsyncStorage.setItem("user", JSON.stringify(loginData.user));
        setIsLoggedIn(true);
        Alert.alert("Success", "Account created and logged in successfully");
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      console.error("Registration error:", err);
      Alert.alert(
        "Registration Error", 
        err.message || "Check your network connection and try again"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        {/* Name */}
        <View style={styles.inputBox}>
          <MaterialIcons name="person-outline" size={20} color="#64748b" />
          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <View style={styles.inputBox}>
          <MaterialIcons name="email" size={20} color="#64748b" />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputBox}>
          <MaterialIcons name="lock-outline" size={20} color="#64748b" />
          <TextInput
            placeholder="Password (min. 6 characters)"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <MaterialIcons
              name={passwordVisible ? "visibility" : "visibility-off"}
              size={22}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputBox}>
          <MaterialIcons name="lock-outline" size={20} color="#64748b" />
          <TextInput
            placeholder="Confirm Password"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!confirmPasswordVisible}
          />
          <TouchableOpacity
            onPress={() =>
              setConfirmPasswordVisible(!confirmPasswordVisible)
            }
          >
            <MaterialIcons
              name={confirmPasswordVisible ? "visibility" : "visibility-off"}
              size={22}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={register}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
        >
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#2563eb",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#1e293b",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#93c5fd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: 15,
  },
});
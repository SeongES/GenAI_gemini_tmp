import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import MenuReviewScreen from './src/screens/MenuReviewScreen';
import { Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';

const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [audioPath, setAudioPath] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transcription, setTranscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Replace with your computer's actual IP address
  const API_URL = "http://166.104.146.34:5000/";

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setSummary(null); // Clear previous summary
      uploadImage(result.assets[0].uri);
    }
  };

  const pickAudio = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true
      });
      
      console.log("Audio pick result:", result);
      
      if (result.type === 'success' || result.canceled === false) {
        // Handle difference between Expo SDK versions
        const uri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
        
        if (!uri) {
          throw new Error("Could not get audio file URI");
        }
        
        setSelectedAudio(uri);
        setTranscription(null); // Clear previous transcription
        uploadAudio(uri);
      }
    } catch (error) {
      console.error('Error picking audio file:', error);
      setError('Failed to pick audio file: ' + error.message);
    }
  };

  const uploadImage = async (uri) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      
      // For web, we need to handle this differently
      if (Platform.OS === 'web') {
        // For web, we need to fetch the image as a blob
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Get the filename
        const filename = uri.split('/').pop();
        
        // Append the blob to FormData with the correct filename
        formData.append('image', blob, filename);
      } else {
        // For mobile, use the original approach
        formData.append('image', {
          uri: uri,
          name: uri.split('/').pop(),
          type: 'image/jpeg',
        });
      }
  
      console.log("Uploading image to:", `${API_URL}/upload`);
      
      // Send the request to your actual IP address, not localhost
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("Upload image response:", result);
      
      if (result.image_path) {
        setImagePath(result.image_path);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAudio = async (uri) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a FormData object
      const formData = new FormData();
      
      console.log("Preparing to upload audio from URI:", uri);
      
      if (Platform.OS === 'web') {
        try {
          // For web, we need to fetch the audio as a blob
          const response = await fetch(uri);
          const blob = await response.blob();
          
          // Get the filename
          const filename = uri.split('/').pop();
          
          console.log("Web: Created blob for file:", filename, "type:", blob.type);
          
          // Append the blob to FormData with the correct filename and explicit MIME type
          formData.append('audio', blob, filename);
        } catch (error) {
          console.error("Error creating blob from URI:", error);
          throw new Error("Failed to prepare audio file: " + error.message);
        }
      } else {
        // For mobile, determine file type from URI if possible
        const fileExtension = uri.split('.').pop().toLowerCase();
        let fileType = 'audio/mpeg'; // Default to mp3
        
        if (fileExtension === 'wav') fileType = 'audio/wav';
        else if (fileExtension === 'm4a') fileType = 'audio/m4a';
        else if (fileExtension === 'ogg') fileType = 'audio/ogg';
        
        console.log("Mobile: Uploading file with type:", fileType);
        
        // For mobile, use the original approach with explicit type
        formData.append('audio', {
          uri: uri,
          name: uri.split('/').pop(),
          type: fileType,
        });
      }
      
      console.log("Sending audio upload to:", `${API_URL}/upload_audio`);
      
      // Send the request to upload audio
      const response = await fetch(`${API_URL}/upload_audio`, {
        method: 'POST',
        body: formData,
      });
      
      console.log("Upload response status:", response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }
  
      const result = await response.json();
      console.log("Upload audio response:", result);
      
      if (result.audio_path) {
        setAudioPath(result.audio_path);
      }
    } catch (error) {
      console.error("Error uploading audio:", error);
      setError("Failed to upload audio: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSummarize = async () => {
    if (!imagePath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Requesting summary for image:", imagePath);
      
      let response = await fetch(`${API_URL}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_path: imagePath }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      let result = await response.json();
      console.log("Summary result:", result);
      
      setSummary(result.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setError("Failed to load summary: " + error.message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioPath) {
      setError("No audio file path available");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Requesting transcription for audio:", audioPath);
      
      let response = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_path: audioPath }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      let result = await response.json();
      console.log("Transcription result:", result);
      
      setTranscription(result.transcription);
    } catch (error) {
      console.error("Error fetching transcription:", error);
      setError("Failed to load transcription: " + error.message);
      setTranscription(null);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Menu & Audio Review</Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Menu Image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.uploadButton} onPress={pickAudio}>
            <Text style={styles.buttonText}>Upload Audio File</Text>
          </TouchableOpacity>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {/* Image Section */}
        {selectedImage && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Menu Image</Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.image} />
            </View>
            
            {imagePath && !loading && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleSummarize}
              >
                <Text style={styles.buttonText}>Summarize Menu</Text>
              </TouchableOpacity>
            )}
            
            {summary && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>🍽️ Menu Summary:</Text>
                <Markdown style={styles.markdownText}>
                  {summary}
                </Markdown>
              </View>
            )}
          </View>
        )}
        
        {/* Audio Section */}
        {selectedAudio && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Audio File</Text>
            <Text style={styles.audioFileName}>
              {selectedAudio.split('/').pop()}
            </Text>
            
            {audioPath && !loading && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleTranscribe}
              >
                <Text style={styles.buttonText}>Transcribe Audio</Text>
              </TouchableOpacity>
            )}
            
            {transcription && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>🎙️ Transcription:</Text>
                <Text style={styles.transcriptionText}>{transcription}</Text>
              </View>
            )}
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MenuReview" component={MenuReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5fcff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#5cb85c',
    padding: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionContainer: {
    width: '100%',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  imageContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
    borderRadius: 5,
  },
  audioFileName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  resultContainer: {
    width: '100%',
    backgroundColor: '#e6f7ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  markdownText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  loadingContainer: {
    padding: 15,
    marginTop: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#fee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcc',
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#c00',
    textAlign: 'center',
  }
});
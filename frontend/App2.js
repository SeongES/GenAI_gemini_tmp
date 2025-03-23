import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import MenuReviewScreen from './src/screens/MenuReviewScreen'; // Import MenuReviewScreen
import { Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';



const Stack = createStackNavigator();

function HomeScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Replace with your computer's actual IP address
  // You can find it by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
  const API_URL = "http://100.65.10.200:5000/"; // Replace X with your actual IP

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
  const uploadImage = async (uri) => {
    setLoading(true);
    
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
  
      // Send the request to your actual IP address, not localhost
      const response = await fetch("http://100.65.10.200:5000/upload", {
        method: 'POST',
        body: formData,
        // Important: Do not set the Content-Type header explicitly
        // Let the browser set it with the correct boundary
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      if (result.image_path) {
        setImagePath(result.image_path);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSummarize = async () => {
    if (!imagePath) return;
    
    setLoading(true);
    try {
      let response = await fetch(`${API_URL}/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_path: imagePath }),
      });
  
      let result = await response.json();
      console.log(result);  // Print the response to check the format
      setSummary(result.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Failed to load summary.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu Review</Text>
      <Button title="Upload Menu Image" onPress={pickImage} />
      
      {selectedImage && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.image} />
        </View>
      )}

      {/* Only show Summarize button when an image has been uploaded */}
      {imagePath && !loading && (
        <Button
          title="Summarize"
          onPress={handleSummarize}
        />
      )}

      {loading && (
        <Text style={styles.loadingText}>Processing...</Text>
      )}

      {summary && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>🍽️ Gemini Summary:</Text>
          <Markdown style={styles.markdownText}>
            {summary}
          </Markdown>
        </View>
      )}
    </View>
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
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5fcff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  imageContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: '#e6f7ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: '#e6f7ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  markdownText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333", // Dark gray for readability
  },
  loadingText: {
    marginVertical: 20,
    fontSize: 16,
    color: '#666',
  }
});


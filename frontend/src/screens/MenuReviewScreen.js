import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function MenuReviewScreen({ route, navigation }) {
  console.log("MenuReviewScreen is rendering!");

  const [summary, setSummary] = useState("Loading summary...");
  const { imagePath } = route.params || {};  // Get image path from navigation params

  useEffect(() => {
    if (imagePath) {
      fetchSummary(imagePath);
    }
  }, [imagePath]);

  const fetchSummary = async (imagePath) => {
    try {
      let response = await fetch("http://localhost:5000/generate_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_path: imagePath }),
      });

      let result = await response.json();
      setSummary(result.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Failed to load summary.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Review</Text>
      <Text style={styles.summaryText}>{summary}</Text>
      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingText: {
    marginVertical: 20,
    fontSize: 16,
    color: '#666',
  }
});
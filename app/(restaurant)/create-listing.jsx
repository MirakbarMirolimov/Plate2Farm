import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser } from '../../lib/auth';
import { createListing } from '../../lib/listings';
import { uploadImage } from '../../lib/storage';

export default function CreateListing() {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const router = useRouter();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '📱 Photo Access Needed', 
        'To showcase your delicious food, we need access to your photo library. This helps farms see what you\'re offering!',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      '📸 Add Product Photo',
      'Help customers see your delicious food! Choose how you\'d like to add a photo:',
      [
        { 
          text: '📷 Take Photo', 
          onPress: openCamera,
          style: 'default'
        },
        { 
          text: '🖼️ Choose from Gallery', 
          onPress: openImageLibrary,
          style: 'default'
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '📷 Camera Access Needed', 
        'We need camera permission to help you take beautiful photos of your food. This makes your listings more appealing to farms!',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleCreateListing = async () => {
    if (!itemName || !quantity || !expiresAt) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    // Basic date validation
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    if (expirationDate <= now) {
      Alert.alert('Error', 'Expiration date must be in the future');
      return;
    }

    setLoading(true);

    try {
      const { user } = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      let imageUrl = null;

      // Upload image if one was selected
      if (imageUri) {
        setUploadingImage(true);
        const { url, error: uploadError } = await uploadImage(imageUri, user.id);
        
        if (uploadError) {
          Alert.alert('Warning', 'Failed to upload image, but listing will be created without photo.');
        } else {
          imageUrl = url;
        }
        setUploadingImage(false);
      }

      const { listing, error } = await createListing(
        user.id,
        itemName,
        quantity,
        expirationDate.toISOString(),
        imageUrl,
        description
      );

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success',
          'Listing created successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create listing');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const setQuickExpiration = (hours) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    setExpiresAt(formatDateForInput(date));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create New Listing</Text>
        </View>

        <View style={styles.form}>
          {/* Photo Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Photo</Text>
            {imageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                <Text style={styles.photoButtonText}>📸 Add Photo</Text>
                <Text style={styles.photoButtonSubtext}>Take a picture or choose from library</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fresh Salad Mix, Bread Rolls"
              value={itemName}
              onChangeText={setItemName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Optional description of the food item..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10 portions, 5 lbs, 20 items"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expires At *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DDTHH:MM"
              value={expiresAt}
              onChangeText={setExpiresAt}
            />
            <Text style={styles.helpText}>
              Format: YYYY-MM-DDTHH:MM (e.g., 2024-12-25T18:00)
            </Text>
          </View>

          <View style={styles.quickButtons}>
            <Text style={styles.quickButtonsLabel}>Quick set expiration:</Text>
            <View style={styles.quickButtonsRow}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => setQuickExpiration(2)}
              >
                <Text style={styles.quickButtonText}>2 hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => setQuickExpiration(6)}
              >
                <Text style={styles.quickButtonText}>6 hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => setQuickExpiration(24)}
              >
                <Text style={styles.quickButtonText}>1 day</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, (loading || uploadingImage) && styles.createButtonDisabled]}
            onPress={handleCreateListing}
            disabled={loading || uploadingImage}
          >
            <Text style={styles.createButtonText}>
              {uploadingImage ? 'Uploading Photo...' : loading ? 'Creating...' : 'Create Listing'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#48bb78',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  form: {
    paddingHorizontal: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  quickButtons: {
    gap: 8,
  },
  quickButtonsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#48bb78',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    color: '#48bb78',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#48bb78',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Photo styles
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoButton: {
    backgroundColor: '#f7fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 18,
    color: '#4a5568',
    fontWeight: '600',
    marginBottom: 4,
  },
  photoButtonSubtext: {
    fontSize: 14,
    color: '#718096',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});

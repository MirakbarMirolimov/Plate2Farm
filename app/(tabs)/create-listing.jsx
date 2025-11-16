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
      'Choose how you\'d like to add a photo of your surplus food',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '📷 Camera', onPress: openCamera },
        { text: '🖼️ Photo Library', onPress: openImageLibrary }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission needed', 'Please allow camera access to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
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

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setImageUri(null) }
      ]
    );
  };

  const validateForm = () => {
    if (!itemName.trim()) {
      Alert.alert('Missing Information', 'Please enter the item name');
      return false;
    }
    if (!quantity.trim()) {
      Alert.alert('Missing Information', 'Please enter the quantity');
      return false;
    }
    if (!expiresAt.trim()) {
      Alert.alert('Missing Information', 'Please enter when this expires');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get current user
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to create a listing');
        return;
      }

      let imageUrl = null;

      // Upload image if selected
      if (imageUri) {
        setUploadingImage(true);
        console.log('📸 Starting image upload process...');
        console.log('📸 Image URI:', imageUri);
        console.log('👤 User ID:', user.id);
        
        const { url, error: uploadError } = await uploadImage(imageUri, user.id);
        
        if (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          console.error('❌ Error details:', uploadError.message);
          
          Alert.alert(
            'Image Upload Failed', 
            `Failed to upload image: ${uploadError.message}\n\nYou can create the listing without an image and add one later.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
              { text: 'Continue Without Image', onPress: () => proceedWithListing(null) }
            ]
          );
          return;
        }
        
        if (!url) {
          console.warn('⚠️ Image upload returned no URL');
          Alert.alert(
            'Image Upload Issue', 
            'Image upload completed but no URL was returned. Creating listing without image.',
            [
              { text: 'OK', onPress: () => proceedWithListing(null) }
            ]
          );
          return;
        }
        
        imageUrl = url;
        console.log('✅ Image uploaded successfully!');
        console.log('🔗 Image URL:', imageUrl);
        setUploadingImage(false);
      }

      await proceedWithListing(imageUrl);
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const proceedWithListing = async (imageUrl) => {
    try {
      const { user } = await getCurrentUser();
      
      // Parse expiration date (simple format for now)
      const expirationDate = new Date();
      const hoursToAdd = parseInt(expiresAt) || 24;
      expirationDate.setHours(expirationDate.getHours() + hoursToAdd);

      console.log('📝 Creating listing...');
      const { listing, error } = await createListing(
        user.id,
        itemName.trim(),
        quantity.trim(),
        expirationDate.toISOString(),
        imageUrl,
        description.trim() || null
      );

      if (error) {
        console.error('❌ Failed to create listing:', error);
        Alert.alert('Error', 'Failed to create listing. Please try again.');
        return;
      }

      console.log('✅ Listing created successfully:', listing);
      Alert.alert(
        'Success! 🎉',
        'Your surplus food listing has been posted and is now available for farms to claim.',
        [
          { 
            text: 'View Listings', 
            onPress: () => router.replace('/(tabs)/listings')
          }
        ]
      );

      // Reset form
      setItemName('');
      setQuantity('');
      setDescription('');
      setExpiresAt('');
      setImageUri(null);
    } catch (error) {
      console.error('❌ Error creating listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Listing</Text>
        <Text style={styles.subtitle}>Post surplus food for farms to claim</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Product Photo</Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
              <Text style={styles.imagePlaceholderSubtext}>Help farms see what you're offering</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Item Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Item Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g., Fresh Bread, Leftover Pizza, Vegetables"
              placeholderTextColor="#a0aec0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 5 loaves, 2 pizzas, 10 lbs"
              placeholderTextColor="#a0aec0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details about the food..."
              placeholderTextColor="#a0aec0"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Expiration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Expiration</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expires in (hours) *</Text>
            <TextInput
              style={styles.input}
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="e.g., 24 (for 24 hours from now)"
              placeholderTextColor="#a0aec0"
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Enter the number of hours from now when this food expires
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {uploadingImage ? '📸 Uploading Image...' : loading ? '📝 Creating Listing...' : '🚀 Post Listing'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginBottom: 10,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 4,
  },
  imagePlaceholderSubtext: {
    fontSize: 14,
    color: '#718096',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2d3748',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#48bb78',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});

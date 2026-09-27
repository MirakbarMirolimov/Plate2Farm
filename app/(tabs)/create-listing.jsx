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
import { colors, radii, shadows, spacing, typography } from '../../constants/theme';

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
        'Photo access needed',
        'Allow photo library access so partners can see what you are offering.',
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
      'Add a product photo',
      'A clear photo helps farms claim the right surplus faster.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo library', onPress: openImageLibrary }
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission needed', 'Please allow camera access to take photos.');
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
      'Remove photo',
      'Remove this photo from the listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setImageUri(null) }
      ]
    );
  };

  const validateForm = () => {
    if (!itemName.trim()) {
      Alert.alert('Missing information', 'Please enter the item name.');
      return false;
    }
    if (!quantity.trim()) {
      Alert.alert('Missing information', 'Please enter the quantity.');
      return false;
    }
    if (!expiresAt.trim()) {
      Alert.alert('Missing information', 'Please enter when this expires.');
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
        Alert.alert('Sign in required', 'Please log in to create a listing.');
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
            'Image upload failed',
            `Could not upload the image: ${uploadError.message}\n\nYou can post without a photo and add one later.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
              { text: 'Continue without image', onPress: () => proceedWithListing(null) }
            ]
          );
          return;
        }
        
        if (!url) {
          console.warn('⚠️ Image upload returned no URL');
          Alert.alert(
            'Image upload issue',
            'Upload finished without a URL. Creating the listing without an image.',
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
      Alert.alert('Could not post', 'Failed to create listing. Please try again.');
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
        Alert.alert('Could not post', 'Failed to create listing. Please try again.');
        return;
      }

      console.log('✅ Listing created successfully:', listing);
      
      // Calculate timer duration
      const now = new Date();
      const expiration = new Date(listing.expires_at);
      const timeDifference = expiration - now;
      const hoursLeft = Math.floor(timeDifference / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      
      Alert.alert(
        'Listing posted',
        `Your surplus is live for nearby farms.\n\nTime remaining: ${hoursLeft}h ${minutesLeft}m.`,
        [
          { 
            text: 'View feed', 
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
      Alert.alert('Could not post', 'Failed to create listing. Please try again.');
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
        <Text style={styles.title}>Post surplus</Text>
        <Text style={styles.subtitle}>Offer good food for farms to claim before it spoils</Text>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product photo</Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
              <Text style={styles.imagePlaceholderIcon}>+</Text>
              <Text style={styles.imagePlaceholderText}>Add a photo</Text>
              <Text style={styles.imagePlaceholderSubtext}>Help farms see what you are offering</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item name *</Text>
            <TextInput
              style={styles.input}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g., Fresh bread, leftover pizza, vegetables"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 5 loaves, 2 trays, 10 lbs"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Packaging, allergens, pickup notes…"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Freshness window</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expires in (hours) *</Text>
            <TextInput
              style={styles.input}
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="e.g., 24"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
            />
            <Text style={styles.helpText}>
              Hours from now until this food should be claimed
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {uploadingImage ? 'Uploading photo…' : loading ? 'Posting listing…' : 'Post listing'}
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
    backgroundColor: colors.bg,
    paddingBottom: 220,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    ...typography.title,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
  },
  form: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.soft,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSoft,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.overlay,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 4,
  },
  imagePlaceholderSubtext: {
    ...typography.caption,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  textArea: {
    height: 88,
    textAlignVertical: 'top',
  },
  helpText: {
    ...typography.caption,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  submitButtonDisabled: {
    backgroundColor: colors.muted,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
  },
  bottomSpacer: {
    height: 140,
  },
});

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
        'Allow photo library access so farms can see what you are offering.',
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
      'Choose how you would like to add a photo of your surplus food.',
      [
        { 
          text: 'Take photo', 
          onPress: openCamera,
          style: 'default'
        },
        { 
          text: 'Choose from library', 
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
        'Camera access needed',
        'Camera permission helps you capture a clear photo for your listing.',
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
      Alert.alert('Missing fields', 'Please fill in the required fields.');
      return;
    }

    // Basic date validation
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    if (expirationDate <= now) {
      Alert.alert('Invalid time', 'Expiration must be in the future.');
      return;
    }

    setLoading(true);

    try {
      const { user } = await getCurrentUser();
      if (!user) {
        Alert.alert('Signed out', 'Please sign in again to create a listing.');
        return;
      }

      let imageUrl = null;

      // Upload image if one was selected
      if (imageUri) {
        setUploadingImage(true);
        const { url, error: uploadError } = await uploadImage(imageUri, user.id);
        
        if (uploadError) {
          Alert.alert('Photo skipped', 'Image upload failed. The listing will be created without a photo.');
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
        Alert.alert('Could not post', error.message);
      } else {
        Alert.alert(
          'Listing posted',
          'Your surplus is now available for farms to claim.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Could not post', 'Failed to create listing.');
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
          <Text style={styles.title}>Post surplus</Text>
          <Text style={styles.subtitle}>Share kitchen leftovers with nearby farm partners</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product photo</Text>
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                  <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                  <Text style={styles.photoButtonText}>Add photo</Text>
                  <Text style={styles.photoButtonSubtext}>Camera or library</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Fresh salad mix, bread rolls"
                placeholderTextColor={colors.muted}
                value={itemName}
                onChangeText={setItemName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes about the food item…"
                placeholderTextColor={colors.muted}
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
                placeholderTextColor={colors.muted}
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expires at *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor={colors.muted}
                value={expiresAt}
                onChangeText={setExpiresAt}
              />
              <Text style={styles.helpText}>
                Format: YYYY-MM-DDTHH:MM (e.g., 2024-12-25T18:00)
              </Text>
            </View>

            <View style={styles.quickButtons}>
              <Text style={styles.quickButtonsLabel}>Quick set expiration</Text>
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
          </View>

          <TouchableOpacity
            style={[styles.createButton, (loading || uploadingImage) && styles.createButtonDisabled]}
            onPress={handleCreateListing}
            disabled={loading || uploadingImage}
          >
            <Text style={styles.createButtonText}>
              {uploadingImage ? 'Uploading photo…' : loading ? 'Posting…' : 'Post listing'}
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
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 50,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.body,
    marginTop: 6,
  },
  form: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
    ...shadows.card,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...typography.label,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    fontSize: 16,
    color: colors.ink,
  },
  helpText: {
    ...typography.caption,
  },
  quickButtons: {
    gap: 8,
  },
  quickButtonsLabel: {
    ...typography.label,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  createButtonDisabled: {
    backgroundColor: colors.muted,
  },
  createButtonText: {
    ...typography.button,
    color: colors.white,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.overlay,
    borderRadius: radii.pill,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  photoButton: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 16,
    color: colors.ink,
    fontWeight: '700',
    marginBottom: 4,
  },
  photoButtonSubtext: {
    ...typography.caption,
  },
  textArea: {
    height: 88,
    textAlignVertical: 'top',
  },
});

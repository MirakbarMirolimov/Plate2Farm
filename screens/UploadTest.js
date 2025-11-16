import React, { useState } from "react";
import { View, Text, Button, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadImage } from "../lib/storage";

export default function UploadTest() {
  const [url, setUrl] = useState(null);
  const userId = "demoUser"; // replace with auth later

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      const uploaded = await uploadImage(imageUri, userId);

      if (uploaded.error) {
        console.log("Upload error:", uploaded.error);
      } else {
        console.log("Uploaded image:", uploaded.url);
        setUrl(uploaded.url);
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Pick & Upload Image" onPress={pickImage} />

      {url && (
        <>
          <Text>Uploaded Image:</Text>
          <Image
            source={{ uri: url }}
            style={{ width: 200, height: 200, marginTop: 20 }}
            resizeMode="contain"
          />
        </>
      )}
    </View>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, Image } from "react-native";
import { CameraView, useCameraPermissions, CameraCapturedPicture } from "expo-camera";
import uploadPhoto from "./uploadPhoto";


export default function AutoCaptureCamera() {
  // Capture runs automatically once permissions are granted
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [objectNames, setObjectNames] = useState<string[] | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const captureIntervalRef = useRef<number | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  
  // Start / stop automatic capture
  // Start capturing automatically once permission is granted; keep capturing until unmount or permission change.
  useEffect(() => {
    if (!permission || !permission.granted) return;

    captureIntervalRef.current = setInterval(async () => {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.5,
            skipProcessing: true,
          });
          setPhotoUri(photo.uri);
          const uploadedObjectNames = await uploadPhoto(photo.uri);
          if (uploadedObjectNames) setObjectNames(uploadedObjectNames);

          setPhotoUri(photo.uri);
          console.log("Captured photo:", photo.uri);
        } catch (err) {
          console.error("Error taking picture:", err);
        }
      }
    }, 1000);

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [permission?.granted]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }



  return (
  <View style={{ flex: 1, position: "relative", backgroundColor: "black" }}>
    {/* Text overlay on top */}
    <Text
      style={{
        position: "absolute",
        top: 50,
        width: "100%",
        textAlign: "center",
        color: "white",
        fontSize: 18,
        fontWeight: "600",
        zIndex: 2,
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      }}
    >
      {objectNames ? objectNames.join(", ") : "No objects detected"}
    </Text>

    {/* Camera view */}
    <CameraView ref={cameraRef} facing="back" style={{ flex: 1 }} />

    {/* Captured photo at bottom */}
    {photoUri && (
      <View
        style={{
          position: "absolute",
          bottom: 20,
          alignSelf: "center",
          zIndex: 1,
        }}
      >
        <Image
          source={{ uri: photoUri }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: "#fff",
          }}
        />
      </View>
    )}
  </View>
);
};

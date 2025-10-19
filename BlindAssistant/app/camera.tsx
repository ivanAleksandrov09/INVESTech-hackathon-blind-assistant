import React, { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, Image } from "react-native";
import { CameraView, useCameraPermissions, CameraCapturedPicture } from "expo-camera";

export default function AutoCaptureCamera() {
  // Capture runs automatically once permissions are granted
  const [photoUri, setPhotoUri] = useState<string | null>(null);
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
      <View style={styles.container}>
        <Text>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} facing="back" />
      <View style={styles.controls}>
        {/* capturing runs automatically; no toggle */}
         {photoUri && (
           <Image
             source={{ uri: photoUri }}
             style={{ width: 100, height: 100, marginTop: 10 }}
           />
         )}
       </View>
     </View>
   );
 };
 
 const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: "#000",
   },
   camera: {
     flex: 1,
   },
   controls: {
     position: "absolute",
     bottom: 20,
     alignSelf: "center",
     alignItems: "center",
   },
 });

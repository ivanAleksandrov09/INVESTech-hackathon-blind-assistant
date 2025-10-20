import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";
import { getLastPhotoBase64 } from "./storage";
import speakObjects from "./tts";

const FLASK_SERVER_HOST = "10.226.105.187:5000";

export default function VoiceRecognition() {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");

  const permissionGrantedRef = useRef(false);
  const mountedRef = useRef(true);
  const shouldRestartRef = useRef(true);
  const transcriptRef = useRef("");

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => {
    setRecognizing(false);
    // If we want always-on, restart after a short delay
    if (shouldRestartRef.current && permissionGrantedRef.current && mountedRef.current) {
      setTimeout(() => {
        ExpoSpeechRecognitionModule.start({
          lang: "en-US",
          interimResults: true,
          continuous: true,
        });
      }, 200);
    }
  });
  useSpeechRecognitionEvent("result", (event) => {
    if (event?.results?.[0]?.transcript) {
      console.log(event.results[event.results.length - 1].transcript);
      if (event.results[event.results.length - 1].transcript.toLowerCase().includes("take photo") ||
          event.results[event.results.length - 1].transcript.toLowerCase().includes("take a photo")) {
            speakObjects("Analyzing the scene.");
        
            uploadLastPhotoAndDescribe();
      }

      transcriptRef.current = event.results[0].transcript;
    }

    setTranscript(event?.results?.[0]?.transcript ?? transcriptRef.current);
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.log("error code:", event.error, "error message:", event.message);
  });

  const startRecognition = async () => {
    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        console.warn("Permissions not granted", result);
        return false;
      }
      permissionGrantedRef.current = true;
      await ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true, // keep streaming
      });
      return true;
    } catch (e) {
      console.warn("start failed", e);
      return false;
    }
  };

  const handleStart = async () => {
    shouldRestartRef.current = true;
    await startRecognition();
  };

  const handleStop = () => {
    // stop and prevent automatic restarts
    shouldRestartRef.current = false;
    permissionGrantedRef.current = false;
    ExpoSpeechRecognitionModule.stop();
  };

  useEffect(() => {
    mountedRef.current = true;
    // start on mount (always-on)
    handleStart();
    return () => {
      mountedRef.current = false;
      shouldRestartRef.current = false;
      ExpoSpeechRecognitionModule.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadLastPhotoAndDescribe = async () => {
    const b64 = await getLastPhotoBase64();

    const response = await fetch(`http://${FLASK_SERVER_HOST}/commands`, {
      method: "POST",
      body: JSON.stringify({ image_b64: b64 }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response received for /commands");

    const data = await response.json();
    speakObjects(data["response"]["description"])

    setTimeout(() => {}, 5000);
  }

  return (
    <View>
      {!recognizing ? (
        <Button title="Start (always-on)" onPress={handleStart} />
      ) : (
        <Button title="Stop" onPress={handleStop} />
      )}

      <ScrollView>
        <Text>{transcript}</Text>
      </ScrollView>
    </View>
  );
}

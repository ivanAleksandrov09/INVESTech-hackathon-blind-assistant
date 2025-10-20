import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useRef, useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";

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
    if (event?.results?.[0]?.transcript) transcriptRef.current = event.results[0].transcript;

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

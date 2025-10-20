import { Text, View } from "react-native";
// import CameraScreen from "./camera";
import VoiceRecognition from "./voiceInput";
import AutoCaptureCamera from "./camera";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <VoiceRecognition />
      <AutoCaptureCamera />
    </View>
  );
}

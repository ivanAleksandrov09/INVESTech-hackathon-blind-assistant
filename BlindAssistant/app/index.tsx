import { Text, View } from "react-native";
import CameraScreen from "./camera";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CameraScreen />
    </View>
  );
}

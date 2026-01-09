import { SafeAreaView, ScrollView } from "react-native";
import { styles } from "../../styles/native";

export default function Screen({ children }) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

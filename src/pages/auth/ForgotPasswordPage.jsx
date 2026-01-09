import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, styles as shared } from "../../styles/native";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  async function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Falta informacion", "Ingresa tu email.");
      return;
    }

    try {
      setSubmitting(true);
      Alert.alert(
        "Listo",
        "Te enviamos un link para recuperar la contrasena."
      );
      navigation.navigate("ResetPassword", { email: email.trim() });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={local.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={local.card}
      >
        <Text style={local.title}>Recuperar contrasena</Text>
        <Text style={local.subtitle}>
          Ingresa tu email y te enviamos un link para restablecerla.
        </Text>

        <Text style={shared.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={shared.input}
        />

        <Pressable
          style={[shared.buttonPrimary, local.submitButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={shared.buttonText}>
            {submitting ? "Enviando..." : "Recuperar contrasena"}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={local.footerLink}>Volver al inicio de sesion</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  );
}

const local = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
  footerLink: {
    marginTop: 16,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
  },
});

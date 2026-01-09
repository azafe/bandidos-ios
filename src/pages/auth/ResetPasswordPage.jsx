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
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors, styles as shared } from "../../styles/native";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email;

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.password || !form.confirm) {
      Alert.alert("Falta informacion", "Completa ambos campos.");
      return;
    }
    if (form.password !== form.confirm) {
      Alert.alert("Error", "Las contrasenas no coinciden.");
      return;
    }

    try {
      setSubmitting(true);
      Alert.alert("Listo", "Contrasena actualizada.");
      navigation.navigate("Login");
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
        <Text style={local.title}>Nueva contrasena</Text>
        <Text style={local.subtitle}>
          {email ? `Restableciendo para ${email}` : "Elegi tu nueva contrasena."}
        </Text>

        <Text style={shared.label}>Nueva contrasena</Text>
        <TextInput
          value={form.password}
          onChangeText={(value) => handleChange("password", value)}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={shared.input}
        />

        <Text style={[shared.label, { marginTop: 12 }]}>
          Confirmar contrasena
        </Text>
        <TextInput
          value={form.confirm}
          onChangeText={(value) => handleChange("confirm", value)}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={shared.input}
        />

        <Pressable
          style={[shared.buttonPrimary, local.submitButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={shared.buttonText}>
            {submitting ? "Guardando..." : "Actualizar contrasena"}
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

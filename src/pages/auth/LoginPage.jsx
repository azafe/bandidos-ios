import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import logo from "../../assets/bandidos-logo.jpg";
import { useAuth } from "../../context/AuthContext";
import { colors, styles as shared } from "../../styles/native";

export default function LoginPage() {
  const { login } = useAuth();
  const navigation = useNavigation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.email || !form.password) {
      Alert.alert("Falta informacion", "Completa email y contrasena.");
      return;
    }

    try {
      setSubmitting(true);
      await login({ email: form.email, password: form.password });
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo iniciar sesion.");
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
        <Image source={logo} style={local.logo} />
        <Text style={local.title}>Bandidos</Text>
        <Text style={local.subtitle}>Inicio de sesion</Text>

        <View style={local.form}>
          <Text style={shared.label}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => handleChange("email", value)}
            placeholder="tu@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={shared.input}
          />

          <Text style={[shared.label, { marginTop: 12 }]}>Contrasena</Text>
          <TextInput
            value={form.password}
            onChangeText={(value) => handleChange("password", value)}
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
              {submitting ? "Ingresando..." : "Ingresar"}
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={local.footerLink}>Olvide mi contrasena</Text>
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
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
  },
  form: {
    marginTop: 20,
  },
  submitButton: {
    marginTop: 20,
  },
  footerLink: {
    marginTop: 16,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
  },
});

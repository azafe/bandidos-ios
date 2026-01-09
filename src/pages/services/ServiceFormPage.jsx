import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { apiRequest } from "../../services/apiClient";
import Screen from "../../components/layout/Screen";
import { colors, styles as shared } from "../../styles/native";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ServiceFormPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const id = route.params?.id;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    customers: [],
    pets: [],
    serviceTypes: [],
    paymentMethods: [],
    employees: [],
  });

  const [form, setForm] = useState({
    date: todayISO(),
    customer_id: "",
    pet_id: "",
    service_type_id: "",
    price: "",
    payment_method_id: "",
    groomer_id: "",
    notes: "",
  });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        setLoading(true);
        const [customers, pets, serviceTypes, paymentMethods, employees] =
          await Promise.all([
            apiRequest("/v2/customers"),
            apiRequest("/v2/pets"),
            apiRequest("/v2/service-types"),
            apiRequest("/v2/payment-methods"),
            apiRequest("/v2/employees"),
          ]);
        if (!active) return;
        setOptions({
          customers: Array.isArray(customers) ? customers : customers?.items || [],
          pets: Array.isArray(pets) ? pets : pets?.items || [],
          serviceTypes: Array.isArray(serviceTypes)
            ? serviceTypes
            : serviceTypes?.items || [],
          paymentMethods: Array.isArray(paymentMethods)
            ? paymentMethods
            : paymentMethods?.items || [],
          employees: Array.isArray(employees)
            ? employees
            : employees?.items || [],
        });
      } catch (err) {
        console.error("[ServiceFormPage] Error cargando opciones:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadService() {
      if (!id) return;
      try {
        const data = await apiRequest(`/v2/services/${id}`);
        if (!active) return;
        setForm({
          date: data.date || todayISO(),
          customer_id: String(data.customer_id || data.customer?.id || ""),
          pet_id: String(data.pet_id || data.pet?.id || ""),
          service_type_id: String(
            data.service_type_id || data.service_type?.id || ""
          ),
          price: data.price ? String(data.price) : "",
          payment_method_id: String(
            data.payment_method_id || data.payment_method?.id || ""
          ),
          groomer_id: String(data.groomer_id || data.groomer?.id || ""),
          notes: data.notes || "",
        });
      } catch (err) {
        console.error("[ServiceFormPage] Error cargando servicio:", err);
      }
    }

    loadService();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit() {
    if (submitting) return;

    setSubmitting(true);

    const payload = {
      date: form.date,
      customer_id: form.customer_id,
      pet_id: form.pet_id,
      service_type_id: form.service_type_id,
      price: Number(form.price || 0),
      payment_method_id: form.payment_method_id,
      groomer_id: form.groomer_id || null,
      notes: form.notes.trim(),
    };

    try {
      if (id) {
        await apiRequest(`/v2/services/${id}`, { method: "PUT", body: payload });
        Alert.alert("Listo", "Servicio actualizado correctamente.");
      } else {
        await apiRequest("/v2/services", { method: "POST", body: payload });
        Alert.alert("Listo", "Servicio guardado correctamente.");
      }
      navigation.navigate("Services");
    } catch (err) {
      console.error("[ServiceFormPage] Error al guardar servicio:", err);
      Alert.alert(
        "Error",
        "Ocurrio un error al guardar el servicio. Revisa la consola."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <Text style={shared.pageTitle}>
          {id ? "Editar servicio" : "Nuevo servicio"}
        </Text>
        <Text style={shared.pageSubtitle}>
          Carga un bano, corte o servicio completo para Bandidos.
        </Text>
      </View>

      <View style={shared.card}>
        {loading && (
          <Text style={shared.cardSubtitle}>
            Cargando clientes y catalogos...
          </Text>
        )}
        <View style={local.formGrid}>
          <View style={local.formField}>
            <Text style={shared.label}>Fecha</Text>
            <TextInput
              value={form.date}
              onChangeText={(value) => handleChange("date", value)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={shared.input}
            />
          </View>

          <View style={local.formField}>
            <Text style={shared.label}>Cliente</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.customer_id}
                onValueChange={(value) => handleChange("customer_id", value)}
                enabled={!loading}
              >
                <Picker.Item label="Selecciona cliente" value="" />
                {options.customers.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={String(c.id)} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={local.formField}>
            <Text style={shared.label}>Mascota</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.pet_id}
                onValueChange={(value) => handleChange("pet_id", value)}
                enabled={!loading}
              >
                <Picker.Item label="Selecciona mascota" value="" />
                {options.pets
                  .filter((p) =>
                    form.customer_id
                      ? String(p.customer_id) === String(form.customer_id)
                      : true
                  )
                  .map((p) => (
                    <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                  ))}
              </Picker>
            </View>
          </View>

          <View style={local.formField}>
            <Text style={shared.label}>Tipo de servicio</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.service_type_id}
                onValueChange={(value) => handleChange("service_type_id", value)}
                enabled={!loading}
              >
                <Picker.Item label="Selecciona servicio" value="" />
                {options.serviceTypes.map((t) => (
                  <Picker.Item key={t.id} label={t.name} value={String(t.id)} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={local.formField}>
            <Text style={shared.label}>Precio (ARS)</Text>
            <TextInput
              value={form.price}
              onChangeText={(value) => handleChange("price", value)}
              placeholder="Ej: 8500"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={shared.input}
            />
          </View>

          <View style={local.formField}>
            <Text style={shared.label}>Metodo de pago</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.payment_method_id}
                onValueChange={(value) =>
                  handleChange("payment_method_id", value)
                }
                enabled={!loading}
              >
                <Picker.Item label="Selecciona metodo" value="" />
                {options.paymentMethods.map((m) => (
                  <Picker.Item key={m.id} label={m.name} value={String(m.id)} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={local.formField}>
            <Text style={shared.label}>Groomer</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.groomer_id}
                onValueChange={(value) => handleChange("groomer_id", value)}
                enabled={!loading}
              >
                <Picker.Item label="Selecciona" value="" />
                {options.employees.map((emp) => (
                  <Picker.Item key={emp.id} label={emp.name} value={String(emp.id)} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={local.formFieldFull}>
            <Text style={shared.label}>Notas</Text>
            <TextInput
              value={form.notes}
              onChangeText={(value) => handleChange("notes", value)}
              placeholder="Observaciones del perro o del servicio..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              style={[shared.input, local.textArea]}
            />
          </View>

          <View style={local.formFieldFull}>
            <Pressable
              style={shared.buttonPrimary}
              onPress={handleSubmit}
              disabled={submitting || loading}
            >
              <Text style={shared.buttonText}>
                {submitting ? "Guardando..." : "Guardar servicio"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const local = StyleSheet.create({
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  formField: {
    width: "48%",
    marginRight: "4%",
    marginBottom: 12,
  },
  formFieldFull: {
    width: "100%",
    marginBottom: 12,
  },
  pickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
});

import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useApiResource } from "../../hooks/useApiResource";
import Modal from "../../components/ui/Modal";
import Screen from "../../components/layout/Screen";
import { colors, styles as shared } from "../../styles/native";
import { confirmDelete } from "../../utils/confirmDelete";

export default function SuppliersPage() {
  const [filters, setFilters] = useState({ q: "", category: "" });
  const {
    items: suppliers,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useApiResource("/v2/suppliers", filters);
  const { items: paymentMethods } = useApiResource("/v2/payment-methods");
  const [editingId, setEditingId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    category: "",
    phone: "",
    payment_method_id: "",
    notes: "",
  });
  const paymentMethodById = useMemo(() => {
    const entries = paymentMethods.map((method) => [
      String(method.id),
      method.name,
    ]);
    return new Map(entries);
  }, [paymentMethods]);

  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  const [form, setForm] = useState({
    name: "",
    category: "",
    phone: "",
    payment: "",
    notes: "",
  });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del proveedor.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        phone: form.phone.trim(),
        payment_method_id: form.payment || null,
        notes: form.notes.trim(),
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el proveedor.");
      return;
    }

    setForm({
      name: "",
      category: "",
      phone: "",
      payment: "",
      notes: "",
    });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este proveedor?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el proveedor.");
      return false;
    }
  }

  function startEdit(supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || "",
      category: supplier.category || "",
      phone: supplier.phone || "",
      payment: String(supplier.payment_method_id || ""),
      notes: supplier.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      phone: "",
      payment: "",
      notes: "",
    });
  }

  function openModalEdit(supplier) {
    setModalForm({
      name: supplier.name || "",
      category: supplier.category || "",
      phone: supplier.phone || "",
      payment_method_id: String(supplier.payment_method_id || ""),
      notes: supplier.notes || "",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedSupplier) return;
    if (!modalForm.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del proveedor.");
      return;
    }
    try {
      await updateItem(selectedSupplier.id, {
        name: modalForm.name.trim(),
        category: modalForm.category.trim(),
        phone: modalForm.phone.trim(),
        payment_method_id: modalForm.payment_method_id || null,
        notes: modalForm.notes.trim(),
      });
      setSelectedSupplier((prev) =>
        prev
          ? {
              ...prev,
              name: modalForm.name.trim(),
              category: modalForm.category.trim(),
              phone: modalForm.phone.trim(),
              payment_method_id: modalForm.payment_method_id || null,
              notes: modalForm.notes.trim(),
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el proveedor.");
    }
  }

  function closeModal() {
    setSelectedSupplier(null);
    setIsEditingModal(false);
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <View style={local.headerRow}>
          <View style={local.headerText}>
            <Text style={shared.pageTitle}>Proveedores</Text>
            <Text style={shared.pageSubtitle}>
              Registra y gestiona proveedores para insumos y servicios.
            </Text>
          </View>
          <View style={local.filterRow}>
            <TextInput
              value={filters.q}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, q: value }))
              }
              placeholder="Buscar proveedor..."
              placeholderTextColor={colors.textMuted}
              style={[shared.pillInput, local.filterInput]}
            />
            <TextInput
              value={filters.category}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, category: value }))
              }
              placeholder="Filtrar por rubro..."
              placeholderTextColor={colors.textMuted}
              style={[shared.pillInput, local.filterInput]}
            />
          </View>
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar proveedor" : "Nuevo proveedor"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Completa los datos basicos del proveedor.
        </Text>

        <View style={local.formGrid}>
          <View style={local.formField}>
            <Text style={shared.label}>Nombre</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => handleChange("name", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Rubro</Text>
            <TextInput
              value={form.category}
              onChangeText={(value) => handleChange("category", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Telefono</Text>
            <TextInput
              value={form.phone}
              onChangeText={(value) => handleChange("phone", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Metodo de pago</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.payment}
                onValueChange={(value) => handleChange("payment", value)}
              >
                <Picker.Item label="Selecciona metodo" value="" />
                {paymentMethods.map((method) => (
                  <Picker.Item
                    key={method.id}
                    label={method.name}
                    value={String(method.id)}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={local.formFieldFull}>
            <Text style={shared.label}>Notas</Text>
            <TextInput
              value={form.notes}
              onChangeText={(value) => handleChange("notes", value)}
              multiline
              numberOfLines={3}
              style={[shared.input, local.textArea]}
            />
          </View>
        </View>

        <View style={local.formActions}>
          <Pressable style={shared.buttonPrimary} onPress={handleSubmit}>
            <Text style={shared.buttonText}>
              {editingId ? "Guardar cambios" : "Guardar proveedor"}
            </Text>
          </Pressable>
          {editingId && (
            <Pressable style={shared.buttonSecondary} onPress={cancelEdit}>
              <Text style={shared.buttonTextLight}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Listado de proveedores</Text>
        <Text style={shared.cardSubtitle}>Proveedores registrados.</Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {suppliers.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin proveedores cargados.
          </Text>
        ) : (
          suppliers.map((s) => (
            <Pressable
              key={s.id}
              style={local.listItem}
              onPress={() => setSelectedSupplier(s)}
            >
              <Text style={local.listTitle}>{s.name}</Text>
              <Text style={local.listMeta}>Rubro: {s.category || "-"}</Text>
              <Text style={local.listMeta}>Telefono: {s.phone || "-"}</Text>
              <Text style={local.listMeta}>
                Metodo:{" "}
                {paymentMethodById.get(String(s.payment_method_id)) || "-"}
              </Text>
              {s.notes && (
                <Text style={local.listMeta}>
                  Notas: {truncate(s.notes, 80)}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedSupplier)}
        onClose={closeModal}
        title="Detalle del proveedor"
      >
        {selectedSupplier && (
          <View>
            {isEditingModal ? (
              <View>
                <Text style={shared.label}>Nombre</Text>
                <TextInput
                  value={modalForm.name}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, name: value }))
                  }
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>Rubro</Text>
                <TextInput
                  value={modalForm.category}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, category: value }))
                  }
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>Telefono</Text>
                <TextInput
                  value={modalForm.phone}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, phone: value }))
                  }
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>
                  Metodo de pago
                </Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.payment_method_id}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({
                        ...prev,
                        payment_method_id: value,
                      }))
                    }
                  >
                    <Picker.Item label="Selecciona metodo" value="" />
                    {paymentMethods.map((method) => (
                      <Picker.Item
                        key={method.id}
                        label={method.name}
                        value={String(method.id)}
                      />
                    ))}
                  </Picker>
                </View>
                <Text style={[shared.label, { marginTop: 12 }]}>Notas</Text>
                <TextInput
                  value={modalForm.notes}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, notes: value }))
                  }
                  multiline
                  numberOfLines={3}
                  style={[shared.input, local.textArea]}
                />
              </View>
            ) : (
              <View>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Nombre: </Text>
                  {selectedSupplier.name || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Rubro: </Text>
                  {selectedSupplier.category || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Telefono: </Text>
                  {selectedSupplier.phone || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Metodo: </Text>
                  {paymentMethodById.get(String(selectedSupplier.payment_method_id)) ||
                    "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Notas: </Text>
                  {selectedSupplier.notes || "-"}
                </Text>
              </View>
            )}
            <View style={local.modalActions}>
              {isEditingModal ? (
                <>
                  <Pressable
                    style={[shared.buttonSecondary, local.modalButton]}
                    onPress={() => setIsEditingModal(false)}
                  >
                    <Text style={shared.buttonTextLight}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonPrimary, local.modalButton]}
                    onPress={handleModalSave}
                  >
                    <Text style={shared.buttonText}>Guardar cambios</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={[shared.buttonPrimary, local.modalButton]}
                    onPress={() => openModalEdit(selectedSupplier)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedSupplier.id);
                      if (removed) closeModal();
                    }}
                  >
                    <Text style={shared.buttonTextLight}>Eliminar</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        )}
      </Modal>
    </Screen>
  );
}

const local = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  headerText: {
    flexShrink: 1,
    marginRight: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  filterInput: {
    minWidth: 200,
    marginRight: 8,
    marginBottom: 8,
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
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
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  listItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  listMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  centerText: {
    textAlign: "center",
    marginTop: 12,
  },
  modalLabel: {
    fontWeight: "600",
    color: colors.text,
  },
  modalText: {
    color: colors.textMuted,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginRight: 8,
  },
});

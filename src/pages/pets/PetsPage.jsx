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
import { useAuth } from "../../context/AuthContext";
import { confirmDelete } from "../../utils/confirmDelete";

export default function PetsPage() {
  const [filters, setFilters] = useState({ customer_id: "", q: "" });
  const {
    items: pets,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useApiResource("/v2/pets", filters);
  const { items: customers } = useApiResource("/v2/customers");
  const { user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    customer_id: "",
    name: "",
    breed: "",
    size: "",
    notes: "",
  });
  const isAdmin = user?.role === "admin";
  const customerById = useMemo(() => {
    const entries = customers.map((customer) => [
      String(customer.id),
      customer.name,
    ]);
    return new Map(entries);
  }, [customers]);

  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  const [form, setForm] = useState({
    customer_id: "",
    name: "",
    breed: "",
    size: "",
    notes: "",
  });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.customer_id) {
      Alert.alert("Falta informacion", "Ingresa nombre y cliente.");
      return;
    }

    try {
      const payload = {
        customer_id: form.customer_id,
        name: form.name.trim(),
        breed: form.breed.trim(),
        size: form.size.trim(),
        notes: form.notes.trim(),
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar la mascota.");
      return;
    }

    setForm({
      customer_id: "",
      name: "",
      breed: "",
      size: "",
      notes: "",
    });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar esta mascota?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar la mascota.");
      return false;
    }
  }

  function openModalEdit(pet) {
    setModalForm({
      customer_id: String(pet.customer_id || ""),
      name: pet.name || "",
      breed: pet.breed || "",
      size: pet.size || "",
      notes: pet.notes || "",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedPet) return;
    if (!modalForm.name.trim() || !modalForm.customer_id) {
      Alert.alert("Falta informacion", "Ingresa nombre y cliente.");
      return;
    }
    try {
      await updateItem(selectedPet.id, {
        customer_id: modalForm.customer_id,
        name: modalForm.name.trim(),
        breed: modalForm.breed.trim(),
        size: modalForm.size.trim(),
        notes: modalForm.notes.trim(),
      });
      setSelectedPet((prev) =>
        prev
          ? {
              ...prev,
              customer_id: modalForm.customer_id,
              name: modalForm.name.trim(),
              breed: modalForm.breed.trim(),
              size: modalForm.size.trim(),
              notes: modalForm.notes.trim(),
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar la mascota.");
    }
  }

  function closeModal() {
    setSelectedPet(null);
    setIsEditingModal(false);
  }

  function startEdit(pet) {
    setEditingId(pet.id);
    setForm({
      customer_id: String(pet.customer_id || ""),
      name: pet.name || "",
      breed: pet.breed || "",
      size: pet.size || "",
      notes: pet.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      customer_id: "",
      name: "",
      breed: "",
      size: "",
      notes: "",
    });
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <View style={local.headerRow}>
          <View style={local.headerText}>
            <Text style={shared.pageTitle}>Mascotas</Text>
            <Text style={shared.pageSubtitle}>
              Registro de perros y datos basicos.
            </Text>
          </View>
          <View style={local.filterRow}>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.customer_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, customer_id: value }))
                }
              >
                <Picker.Item label="Todos los clientes" value="" />
                {customers.map((customer) => (
                  <Picker.Item
                    key={customer.id}
                    label={customer.name}
                    value={String(customer.id)}
                  />
                ))}
              </Picker>
            </View>
            <TextInput
              value={filters.q}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, q: value }))
              }
              placeholder="Buscar por nombre o raza..."
              placeholderTextColor={colors.textMuted}
              style={[shared.pillInput, local.searchInput]}
            />
          </View>
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar mascota" : "Nueva mascota"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Vincula cada mascota con su dueno.
        </Text>

        <View style={local.formGrid}>
          <View style={local.formField}>
            <Text style={shared.label}>Cliente</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.customer_id}
                onValueChange={(value) => handleChange("customer_id", value)}
              >
                <Picker.Item label="Selecciona cliente" value="" />
                {customers.map((customer) => (
                  <Picker.Item
                    key={customer.id}
                    label={customer.name}
                    value={String(customer.id)}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Nombre</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => handleChange("name", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Raza</Text>
            <TextInput
              value={form.breed}
              onChangeText={(value) => handleChange("breed", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Tamano</Text>
            <TextInput
              value={form.size}
              onChangeText={(value) => handleChange("size", value)}
              style={shared.input}
            />
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
              {editingId ? "Guardar cambios" : "Guardar mascota"}
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
        <Text style={shared.cardTitle}>Listado de mascotas</Text>
        <Text style={shared.cardSubtitle}>Mascotas registradas.</Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {pets.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin mascotas cargadas.
          </Text>
        ) : (
          pets.map((pet) => (
            <Pressable
              key={pet.id}
              style={local.listItem}
              onPress={() => setSelectedPet(pet)}
            >
              <Text style={local.listTitle}>{pet.name}</Text>
              <Text style={local.listMeta}>
                Dueno: {customerById.get(String(pet.customer_id)) || "-"}
              </Text>
              <Text style={local.listMeta}>Raza: {pet.breed || "-"}</Text>
              <Text style={local.listMeta}>Tamano: {pet.size || "-"}</Text>
              {pet.notes && (
                <Text style={local.listMeta}>
                  Notas: {truncate(pet.notes, 80)}
                </Text>
              )}
              {isAdmin && (
                <View style={local.listActions}>
                  <Pressable
                    style={[shared.buttonSecondary, local.smallButton]}
                    onPress={() => startEdit(pet)}
                  >
                    <Text style={shared.buttonTextLight}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.smallButton]}
                    onPress={() => handleDelete(pet.id)}
                  >
                    <Text style={shared.buttonTextLight}>Eliminar</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedPet)}
        onClose={closeModal}
        title="Detalle de la mascota"
      >
        {selectedPet && (
          <View>
            {isEditingModal ? (
              <View>
                <Text style={shared.label}>Cliente</Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.customer_id}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({
                        ...prev,
                        customer_id: value,
                      }))
                    }
                  >
                    <Picker.Item label="Selecciona cliente" value="" />
                    {customers.map((customer) => (
                      <Picker.Item
                        key={customer.id}
                        label={customer.name}
                        value={String(customer.id)}
                      />
                    ))}
                  </Picker>
                </View>
                <Text style={[shared.label, { marginTop: 12 }]}>Nombre</Text>
                <TextInput
                  value={modalForm.name}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, name: value }))
                  }
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>Raza</Text>
                <TextInput
                  value={modalForm.breed}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, breed: value }))
                  }
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>Tamano</Text>
                <TextInput
                  value={modalForm.size}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, size: value }))
                  }
                  style={shared.input}
                />
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
                  <Text style={local.modalLabel}>Cliente: </Text>
                  {customerById.get(String(selectedPet.customer_id)) || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Nombre: </Text>
                  {selectedPet.name || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Raza: </Text>
                  {selectedPet.breed || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Tamano: </Text>
                  {selectedPet.size || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Notas: </Text>
                  {selectedPet.notes || "-"}
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
                    onPress={() => openModalEdit(selectedPet)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedPet.id);
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
  searchInput: {
    minWidth: 200,
    marginLeft: 8,
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
  listActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
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

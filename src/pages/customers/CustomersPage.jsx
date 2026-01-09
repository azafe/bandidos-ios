import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useApiResource } from "../../hooks/useApiResource";
import Modal from "../../components/ui/Modal";
import Screen from "../../components/layout/Screen";
import { colors, styles as shared } from "../../styles/native";
import { confirmDelete } from "../../utils/confirmDelete";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const {
    items: customers,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useApiResource("/v2/customers", search ? { q: search } : undefined);
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del cliente.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        notes: form.notes.trim(),
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el cliente.");
      return;
    }

    setForm({
      name: "",
      phone: "",
      email: "",
      notes: "",
    });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este cliente?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el cliente.");
      return false;
    }
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      notes: customer.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      notes: "",
    });
  }

  function openModalEdit(customer) {
    setModalForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      notes: customer.notes || "",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedCustomer) return;
    if (!modalForm.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del cliente.");
      return;
    }
    try {
      await updateItem(selectedCustomer.id, {
        name: modalForm.name.trim(),
        phone: modalForm.phone.trim(),
        email: modalForm.email.trim(),
        notes: modalForm.notes.trim(),
      });
      setSelectedCustomer((prev) =>
        prev
          ? {
              ...prev,
              name: modalForm.name.trim(),
              phone: modalForm.phone.trim(),
              email: modalForm.email.trim(),
              notes: modalForm.notes.trim(),
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el cliente.");
    }
  }

  function closeModal() {
    setSelectedCustomer(null);
    setIsEditingModal(false);
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <View style={local.headerRow}>
          <View style={local.headerText}>
            <Text style={shared.pageTitle}>Clientes</Text>
            <Text style={shared.pageSubtitle}>
              Registro de duenos y datos de contacto.
            </Text>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, email o telefono..."
            placeholderTextColor={colors.textMuted}
            style={[shared.pillInput, local.searchInput]}
          />
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar cliente" : "Nuevo cliente"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Carga los datos para asociar mascotas y servicios.
        </Text>

        <View style={local.formGrid}>
          <View style={local.formField}>
            <Text style={shared.label}>Nombre completo</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => handleChange("name", value)}
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
            <Text style={shared.label}>Email</Text>
            <TextInput
              value={form.email}
              onChangeText={(value) => handleChange("email", value)}
              autoCapitalize="none"
              keyboardType="email-address"
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
              {editingId ? "Guardar cambios" : "Guardar cliente"}
            </Text>
          </Pressable>
          {editingId && (
            <Pressable
              style={shared.buttonSecondary}
              onPress={cancelEdit}
            >
              <Text style={shared.buttonTextLight}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Listado de clientes</Text>
        <Text style={shared.cardSubtitle}>Clientes registrados en Bandidos.</Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {customers.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin clientes cargados.
          </Text>
        ) : (
          customers.map((customer) => (
            <Pressable
              key={customer.id}
              style={local.listItem}
              onPress={() => setSelectedCustomer(customer)}
            >
              <Text style={local.listTitle}>{customer.name}</Text>
              <Text style={local.listMeta}>
                Tel: {customer.phone || "-"}
              </Text>
              <Text style={local.listMeta}>
                Email: {customer.email || "-"}
              </Text>
              {customer.notes && (
                <Text style={local.listMeta}>
                  Notas: {truncate(customer.notes, 80)}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedCustomer)}
        onClose={closeModal}
        title="Detalle del cliente"
      >
        {selectedCustomer && (
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
                <Text style={[shared.label, { marginTop: 12 }]}>Telefono</Text>
                <TextInput
                  value={modalForm.phone}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, phone: value }))
                  }
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>Email</Text>
                <TextInput
                  value={modalForm.email}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, email: value }))
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                  <Text style={local.modalLabel}>Nombre: </Text>
                  {selectedCustomer.name || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Telefono: </Text>
                  {selectedCustomer.phone || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Email: </Text>
                  {selectedCustomer.email || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Notas: </Text>
                  {selectedCustomer.notes || "-"}
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
                    onPress={() => openModalEdit(selectedCustomer)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedCustomer.id);
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
  searchInput: {
    minWidth: 220,
    marginTop: 12,
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
    marginBottom: 6,
  },
  listMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
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

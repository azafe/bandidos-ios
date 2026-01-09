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

export default function PaymentMethodsPage() {
  const { items, loading, error, createItem, updateItem, deleteItem } =
    useApiResource("/v2/payment-methods");
  const [form, setForm] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({ name: "" });

  function handleChange(value) {
    setForm({ name: value });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del metodo.");
      return;
    }
    try {
      const payload = { name: form.name.trim() };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el metodo.");
      return;
    }
    setForm({ name: "" });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este metodo?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el metodo.");
      return false;
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({ name: item.name || "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "" });
  }

  function openModalEdit(item) {
    setModalForm({ name: item.name || "" });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedMethod) return;
    if (!modalForm.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del metodo.");
      return;
    }
    try {
      const payload = { name: modalForm.name.trim() };
      await updateItem(selectedMethod.id, payload);
      setSelectedMethod((prev) =>
        prev ? { ...prev, name: modalForm.name.trim() } : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el metodo.");
    }
  }

  function closeModal() {
    setSelectedMethod(null);
    setIsEditingModal(false);
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <Text style={shared.pageTitle}>Metodos de pago</Text>
        <Text style={shared.pageSubtitle}>
          Aparece en servicios y gastos.
        </Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar metodo" : "Nuevo metodo"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Configura las opciones disponibles.
        </Text>

        <View style={local.formGrid}>
          <View style={local.formField}>
            <Text style={shared.label}>Nombre</Text>
            <TextInput
              value={form.name}
              onChangeText={handleChange}
              style={shared.input}
            />
          </View>
        </View>

        <View style={local.formActions}>
          <Pressable style={shared.buttonPrimary} onPress={handleSubmit}>
            <Text style={shared.buttonText}>
              {editingId ? "Guardar cambios" : "Guardar metodo"}
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
        <Text style={shared.cardTitle}>Listado de metodos</Text>
        <Text style={shared.cardSubtitle}>
          Metodos configurados en el sistema.
        </Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {items.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin metodos cargados.
          </Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={local.listItem}
              onPress={() => setSelectedMethod(item)}
            >
              <Text style={local.listTitle}>{item.name}</Text>
              <View style={local.listActions}>
                <Pressable
                  style={[shared.buttonSecondary, local.smallButton]}
                  onPress={() => startEdit(item)}
                >
                  <Text style={shared.buttonTextLight}>Editar</Text>
                </Pressable>
                <Pressable
                  style={[shared.buttonDanger, local.smallButton]}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={shared.buttonTextLight}>Eliminar</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedMethod)}
        onClose={closeModal}
        title="Detalle del metodo"
      >
        {selectedMethod && (
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
              </View>
            ) : (
              <Text style={local.modalText}>
                <Text style={local.modalLabel}>Nombre: </Text>
                {selectedMethod.name || "-"}
              </Text>
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
                    onPress={() => openModalEdit(selectedMethod)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedMethod.id);
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
  formGrid: {
    marginTop: 12,
  },
  formField: {
    marginBottom: 12,
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

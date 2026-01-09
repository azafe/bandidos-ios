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

export default function ServiceTypesPage() {
  const { items, loading, error, createItem, updateItem, deleteItem } =
    useApiResource("/v2/service-types");
  const [form, setForm] = useState({ name: "", default_price: "" });
  const [editingId, setEditingId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({ name: "", default_price: "" });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del servicio.");
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        default_price: form.default_price ? Number(form.default_price) : null,
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el tipo.");
      return;
    }
    setForm({ name: "", default_price: "" });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este tipo de servicio?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el tipo.");
      return false;
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      default_price: item.default_price ? String(item.default_price) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", default_price: "" });
  }

  function openModalEdit(item) {
    setModalForm({
      name: item.name || "",
      default_price: item.default_price ? String(item.default_price) : "",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedType) return;
    if (!modalForm.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del servicio.");
      return;
    }
    try {
      const payload = {
        name: modalForm.name.trim(),
        default_price: modalForm.default_price
          ? Number(modalForm.default_price)
          : null,
      };
      await updateItem(selectedType.id, payload);
      setSelectedType((prev) =>
        prev
          ? {
              ...prev,
              name: modalForm.name.trim(),
              default_price: modalForm.default_price
                ? Number(modalForm.default_price)
                : null,
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el tipo.");
    }
  }

  function closeModal() {
    setSelectedType(null);
    setIsEditingModal(false);
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <Text style={shared.pageTitle}>Tipos de servicio</Text>
        <Text style={shared.pageSubtitle}>
          Configura los servicios disponibles y sus precios sugeridos.
        </Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar tipo" : "Nuevo tipo"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Usalo para el formulario de servicios.
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
            <Text style={shared.label}>Precio sugerido</Text>
            <TextInput
              value={form.default_price}
              onChangeText={(value) => handleChange("default_price", value)}
              keyboardType="numeric"
              style={shared.input}
            />
          </View>
        </View>

        <View style={local.formActions}>
          <Pressable style={shared.buttonPrimary} onPress={handleSubmit}>
            <Text style={shared.buttonText}>
              {editingId ? "Guardar cambios" : "Guardar tipo"}
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
        <Text style={shared.cardTitle}>Listado de tipos</Text>
        <Text style={shared.cardSubtitle}>Todos los servicios cargados.</Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {items.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin tipos cargados.
          </Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={local.listItem}
              onPress={() => setSelectedType(item)}
            >
              <Text style={local.listTitle}>{item.name}</Text>
              <Text style={local.listMeta}>
                Precio sugerido:{" "}
                {item.default_price ? `$${item.default_price}` : "-"}
              </Text>
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
        isOpen={Boolean(selectedType)}
        onClose={closeModal}
        title="Detalle del tipo"
      >
        {selectedType && (
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
                <Text style={[shared.label, { marginTop: 12 }]}>
                  Precio sugerido
                </Text>
                <TextInput
                  value={modalForm.default_price}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, default_price: value }))
                  }
                  keyboardType="numeric"
                  style={shared.input}
                />
              </View>
            ) : (
              <View>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Nombre: </Text>
                  {selectedType.name || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Precio sugerido: </Text>
                  {selectedType.default_price
                    ? `$${selectedType.default_price}`
                    : "-"}
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
                    onPress={() => openModalEdit(selectedType)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedType.id);
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
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  formField: {
    width: "48%",
    marginRight: "4%",
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

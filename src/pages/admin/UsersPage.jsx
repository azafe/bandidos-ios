import { useState } from "react";
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

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { items, loading, error, createItem, updateItem, deleteItem } =
    useApiResource("/v2/users");
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "staff",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    email: "",
    password: "",
    role: "staff",
  });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.email.trim()) {
      Alert.alert("Falta informacion", "Ingresa email.");
      return;
    }
    if (!editingId && !form.password) {
      Alert.alert("Falta informacion", "Ingresa una contrasena.");
      return;
    }
    try {
      const payload = {
        email: form.email.trim(),
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo crear el usuario.");
      return;
    }
    setForm({ email: "", password: "", role: "staff" });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este usuario?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el usuario.");
      return false;
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      email: item.email || "",
      password: "",
      role: item.role || "staff",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ email: "", password: "", role: "staff" });
  }

  function openModalEdit(item) {
    setModalForm({
      email: item.email || "",
      password: "",
      role: item.role || "staff",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedUser) return;
    if (!modalForm.email.trim()) {
      Alert.alert("Falta informacion", "Ingresa email.");
      return;
    }
    try {
      const payload = {
        email: modalForm.email.trim(),
        role: modalForm.role,
        ...(modalForm.password ? { password: modalForm.password } : {}),
      };
      await updateItem(selectedUser.id, payload);
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              email: modalForm.email.trim(),
              role: modalForm.role,
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el usuario.");
    }
  }

  function closeModal() {
    setSelectedUser(null);
    setIsEditingModal(false);
  }

  if (!isAdmin) {
    return (
      <Screen>
        <View style={shared.card}>
          <Text style={shared.cardSubtitle}>
            Este modulo es exclusivo para administradores.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <Text style={shared.pageTitle}>Usuarios</Text>
        <Text style={shared.pageSubtitle}>
          Gestion de accesos y roles del sistema.
        </Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar usuario" : "Nuevo usuario"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Crea accesos para el equipo administrativo.
        </Text>

        <View style={local.formGrid}>
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
          <View style={local.formField}>
            <Text style={shared.label}>Contrasena</Text>
            <TextInput
              value={form.password}
              onChangeText={(value) => handleChange("password", value)}
              secureTextEntry
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Rol</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Staff" value="staff" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={local.formActions}>
          <Pressable style={shared.buttonPrimary} onPress={handleSubmit}>
            <Text style={shared.buttonText}>
              {editingId ? "Guardar cambios" : "Guardar usuario"}
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
        <Text style={shared.cardTitle}>Listado de usuarios</Text>
        <Text style={shared.cardSubtitle}>
          Usuarios actuales con acceso al sistema.
        </Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {items.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin usuarios cargados.
          </Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={local.listItem}
              onPress={() => setSelectedUser(item)}
            >
              <Text style={local.listTitle}>{item.email}</Text>
              <Text style={local.listMeta}>Rol: {item.role || "-"}</Text>
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
        isOpen={Boolean(selectedUser)}
        onClose={closeModal}
        title="Detalle del usuario"
      >
        {selectedUser && (
          <View>
            {isEditingModal ? (
              <View>
                <Text style={shared.label}>Email</Text>
                <TextInput
                  value={modalForm.email}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, email: value }))
                  }
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>
                  Contrasena
                </Text>
                <TextInput
                  value={modalForm.password}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, password: value }))
                  }
                  secureTextEntry
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>Rol</Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.role}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <Picker.Item label="Admin" value="admin" />
                    <Picker.Item label="Staff" value="staff" />
                  </Picker>
                </View>
              </View>
            ) : (
              <View>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Email: </Text>
                  {selectedUser.email || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Rol: </Text>
                  {selectedUser.role || "-"}
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
                    onPress={() => openModalEdit(selectedUser)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedUser.id);
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

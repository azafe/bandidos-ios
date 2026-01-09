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
import { confirmDelete } from "../../utils/confirmDelete";

export default function EmployeesPage() {
  const {
    items: employees,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useApiResource("/v2/employees");
  const [editingId, setEditingId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    role: "Groomer",
    phone: "",
    email: "",
    status: "active",
    notes: "",
  });

  function truncate(text, max) {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  const [form, setForm] = useState({
    name: "",
    role: "Groomer",
    phone: "",
    email: "",
    status: "active",
    notes: "",
  });

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del empleado.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim(),
        email: form.email.trim(),
        status: form.status,
        notes: form.notes.trim(),
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el empleado.");
      return;
    }

    setForm({
      name: "",
      role: "Groomer",
      phone: "",
      email: "",
      status: "active",
      notes: "",
    });
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este empleado?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el empleado.");
      return false;
    }
  }

  function startEdit(emp) {
    setEditingId(emp.id);
    setForm({
      name: emp.name || "",
      role: emp.role || "Groomer",
      phone: emp.phone || "",
      email: emp.email || "",
      status: emp.status || "active",
      notes: emp.notes || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      role: "Groomer",
      phone: "",
      email: "",
      status: "active",
      notes: "",
    });
  }

  function openModalEdit(employee) {
    setModalForm({
      name: employee.name || "",
      role: employee.role || "Groomer",
      phone: employee.phone || "",
      email: employee.email || "",
      status: employee.status || "active",
      notes: employee.notes || "",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedEmployee) return;
    if (!modalForm.name.trim()) {
      Alert.alert("Falta informacion", "Ingresa el nombre del empleado.");
      return;
    }
    try {
      await updateItem(selectedEmployee.id, {
        name: modalForm.name.trim(),
        role: modalForm.role,
        phone: modalForm.phone.trim(),
        email: modalForm.email.trim(),
        status: modalForm.status,
        notes: modalForm.notes.trim(),
      });
      setSelectedEmployee((prev) =>
        prev
          ? {
              ...prev,
              name: modalForm.name.trim(),
              role: modalForm.role,
              phone: modalForm.phone.trim(),
              email: modalForm.email.trim(),
              status: modalForm.status,
              notes: modalForm.notes.trim(),
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el empleado.");
    }
  }

  function closeModal() {
    setSelectedEmployee(null);
    setIsEditingModal(false);
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <Text style={shared.pageTitle}>Empleados</Text>
        <Text style={shared.pageSubtitle}>
          Registro de colaboradores, groomers y staff.
        </Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar empleado" : "Nuevo empleado"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Administra los datos del equipo de trabajo.
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
            <Text style={shared.label}>Rol</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <Picker.Item label="Groomer" value="Groomer" />
                <Picker.Item label="Bano" value="Bano" />
                <Picker.Item label="Recepcion" value="Recepcion" />
                <Picker.Item label="Admin" value="Admin" />
              </Picker>
            </View>
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
          <View style={local.formField}>
            <Text style={shared.label}>Estado</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <Picker.Item label="Activo" value="active" />
                <Picker.Item label="Inactivo" value="inactive" />
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
              {editingId ? "Guardar cambios" : "Guardar empleado"}
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
        <Text style={shared.cardTitle}>Listado de empleados</Text>
        <Text style={shared.cardSubtitle}>Empleados registrados.</Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {employees.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin empleados cargados.
          </Text>
        ) : (
          employees.map((emp) => (
            <Pressable
              key={emp.id}
              style={local.listItem}
              onPress={() => setSelectedEmployee(emp)}
            >
              <Text style={local.listTitle}>{emp.name}</Text>
              <Text style={local.listMeta}>Rol: {emp.role || "-"}</Text>
              <Text style={local.listMeta}>Telefono: {emp.phone || "-"}</Text>
              <Text style={local.listMeta}>Email: {emp.email || "-"}</Text>
              {emp.notes && (
                <Text style={local.listMeta}>
                  Notas: {truncate(emp.notes, 80)}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedEmployee)}
        onClose={closeModal}
        title="Detalle del empleado"
      >
        {selectedEmployee && (
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
                <Text style={[shared.label, { marginTop: 12 }]}>Rol</Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.role}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <Picker.Item label="Groomer" value="Groomer" />
                    <Picker.Item label="Bano" value="Bano" />
                    <Picker.Item label="Recepcion" value="Recepcion" />
                    <Picker.Item label="Admin" value="Admin" />
                  </Picker>
                </View>
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
                <Text style={[shared.label, { marginTop: 12 }]}>Estado</Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.status}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <Picker.Item label="Activo" value="active" />
                    <Picker.Item label="Inactivo" value="inactive" />
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
                  {selectedEmployee.name || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Rol: </Text>
                  {selectedEmployee.role || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Telefono: </Text>
                  {selectedEmployee.phone || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Email: </Text>
                  {selectedEmployee.email || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Estado: </Text>
                  {selectedEmployee.status || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Notas: </Text>
                  {selectedEmployee.notes || "-"}
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
                    onPress={() => openModalEdit(selectedEmployee)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedEmployee.id);
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

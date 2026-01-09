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

export default function FixedExpensesPage() {
  const [filters, setFilters] = useState({ category_id: "", status: "" });
  const {
    items: fixedExpenses,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useApiResource("/v2/fixed-expenses", filters);
  const { items: categories } = useApiResource("/v2/expense-categories");
  const { items: paymentMethods } = useApiResource("/v2/payment-methods");
  const { items: suppliers } = useApiResource("/v2/suppliers");
  const monthlyTotal = fixedExpenses
    .filter((e) => e.status === "Activo" || e.status === "active")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const [form, setForm] = useState({
    name: "",
    category: "",
    amount: "",
    dueDay: 1,
    paymentMethod: "",
    supplier: "",
    status: "active",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: "",
    category: "",
    amount: "",
    dueDay: 1,
    paymentMethod: "",
    supplier: "",
    status: "active",
  });

  const categoryById = useMemo(() => {
    return new Map(categories.map((cat) => [String(cat.id), cat.name]));
  }, [categories]);
  const paymentById = useMemo(() => {
    return new Map(paymentMethods.map((m) => [String(m.id), m.name]));
  }, [paymentMethods]);
  const supplierById = useMemo(() => {
    return new Map(suppliers.map((s) => [String(s.id), s.name]));
  }, [suppliers]);

  function formatCurrency(value) {
    return `$${Number(value || 0).toLocaleString("es-AR")}`;
  }

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    const amountNumber = Number(form.amount);
    if (!amountNumber || amountNumber <= 0) {
      Alert.alert("Falta informacion", "Ingresa un monto mensual valido.");
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category,
        amount: amountNumber,
        due_day: Number(form.dueDay) || 1,
        payment_method_id: form.paymentMethod,
        supplier_id: form.supplier || null,
        status: form.status,
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el gasto fijo.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      name: "",
      amount: "",
      supplier: "",
    }));
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este gasto fijo?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el gasto fijo.");
      return false;
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setForm({
      name: expense.name || "",
      category: String(expense.category_id || ""),
      amount: expense.amount ? String(expense.amount) : "",
      dueDay: expense.due_day || expense.dueDay || 1,
      paymentMethod: String(expense.payment_method_id || ""),
      supplier: String(expense.supplier_id || ""),
      status: expense.status || "active",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      amount: "",
      dueDay: 1,
      paymentMethod: "",
      supplier: "",
      status: "active",
    });
  }

  function openModalEdit(expense) {
    setModalForm({
      name: expense.name || "",
      category: String(expense.category_id || expense.category?.id || ""),
      amount: expense.amount ? String(expense.amount) : "",
      dueDay: expense.due_day || expense.dueDay || 1,
      paymentMethod: String(
        expense.payment_method_id || expense.payment_method?.id || ""
      ),
      supplier: String(expense.supplier_id || expense.supplier?.id || ""),
      status: expense.status || "active",
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedExpense) return;
    const amountNumber = Number(modalForm.amount);
    if (!amountNumber || amountNumber <= 0) {
      Alert.alert("Falta informacion", "Ingresa un monto mensual valido.");
      return;
    }
    try {
      const payload = {
        name: modalForm.name.trim(),
        category_id: modalForm.category,
        amount: amountNumber,
        due_day: Number(modalForm.dueDay) || 1,
        payment_method_id: modalForm.paymentMethod,
        supplier_id: modalForm.supplier || null,
        status: modalForm.status,
      };
      await updateItem(selectedExpense.id, payload);
      setSelectedExpense((prev) =>
        prev
          ? {
              ...prev,
              name: modalForm.name.trim(),
              category_id: modalForm.category,
              amount: amountNumber,
              due_day: Number(modalForm.dueDay) || 1,
              payment_method_id: modalForm.paymentMethod,
              supplier_id: modalForm.supplier || null,
              status: modalForm.status,
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el gasto fijo.");
    }
  }

  function closeModal() {
    setSelectedExpense(null);
    setIsEditingModal(false);
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <View style={local.headerRow}>
          <View style={local.headerText}>
            <Text style={shared.pageTitle}>Gastos fijos</Text>
            <Text style={shared.pageSubtitle}>
              Registra costos mensuales: alquiler, servicios, sueldos, etc.
            </Text>
          </View>
          <View style={local.filterRow}>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.category_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, category_id: value }))
                }
              >
                <Picker.Item label="Todas las categorias" value="" />
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.id}
                    label={cat.name}
                    value={String(cat.id)}
                  />
                ))}
              </Picker>
            </View>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <Picker.Item label="Todos los estados" value="" />
                <Picker.Item label="Activo" value="active" />
                <Picker.Item label="Inactivo" value="inactive" />
              </Picker>
            </View>
          </View>
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar gasto fijo" : "Nuevo gasto fijo"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Estos gastos se repiten todos los meses.
        </Text>

        <View style={local.formGrid}>
          <View style={local.formField}>
            <Text style={shared.label}>Nombre del gasto</Text>
            <TextInput
              value={form.name}
              onChangeText={(value) => handleChange("name", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Categoria</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <Picker.Item label="Selecciona categoria" value="" />
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.id}
                    label={cat.name}
                    value={String(cat.id)}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Monto mensual</Text>
            <TextInput
              value={form.amount}
              onChangeText={(value) => handleChange("amount", value)}
              keyboardType="numeric"
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Dia de vencimiento</Text>
            <TextInput
              value={String(form.dueDay)}
              onChangeText={(value) => handleChange("dueDay", value)}
              keyboardType="numeric"
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Metodo de pago</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.paymentMethod}
                onValueChange={(value) => handleChange("paymentMethod", value)}
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
          <View style={local.formField}>
            <Text style={shared.label}>Proveedor</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={form.supplier}
                onValueChange={(value) => handleChange("supplier", value)}
              >
                <Picker.Item label="Selecciona proveedor" value="" />
                {suppliers.map((supplier) => (
                  <Picker.Item
                    key={supplier.id}
                    label={supplier.name}
                    value={String(supplier.id)}
                  />
                ))}
              </Picker>
            </View>
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
        </View>

        <View style={local.formActions}>
          <Pressable style={shared.buttonPrimary} onPress={handleSubmit}>
            <Text style={shared.buttonText}>
              {editingId ? "Guardar cambios" : "Guardar gasto fijo"}
            </Text>
          </Pressable>
          {editingId && (
            <Pressable style={shared.buttonSecondary} onPress={cancelEdit}>
              <Text style={shared.buttonTextLight}>Cancelar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={local.totalCard}>
        <Text style={local.totalLabel}>Total mensual activo</Text>
        <Text style={local.totalValue}>{formatCurrency(monthlyTotal)}</Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Listado de gastos fijos</Text>
        <Text style={shared.cardSubtitle}>
          Gastos fijos registrados.
        </Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {fixedExpenses.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin gastos fijos cargados.
          </Text>
        ) : (
          fixedExpenses.map((expense) => (
            <Pressable
              key={expense.id}
              style={local.listItem}
              onPress={() => setSelectedExpense(expense)}
            >
              <Text style={local.listTitle}>{expense.name || "-"}</Text>
              <Text style={local.listMeta}>
                Categoria:{" "}
                {categoryById.get(String(expense.category_id)) || "-"}
              </Text>
              <Text style={local.listMeta}>
                Monto: {formatCurrency(expense.amount)}
              </Text>
              <Text style={local.listMeta}>
                Vence dia: {expense.due_day || expense.dueDay || "-"}
              </Text>
              <Text style={local.listMeta}>
                Metodo:{" "}
                {paymentById.get(String(expense.payment_method_id)) || "-"}
              </Text>
              <Text style={local.listMeta}>
                Proveedor:{" "}
                {supplierById.get(String(expense.supplier_id)) || "-"}
              </Text>
              <Text style={local.listMeta}>
                Estado: {expense.status || "-"}
              </Text>
              <View style={local.listActions}>
                <Pressable
                  style={[shared.buttonSecondary, local.smallButton]}
                  onPress={() => startEdit(expense)}
                >
                  <Text style={shared.buttonTextLight}>Editar</Text>
                </Pressable>
                <Pressable
                  style={[shared.buttonDanger, local.smallButton]}
                  onPress={() => handleDelete(expense.id)}
                >
                  <Text style={shared.buttonTextLight}>Eliminar</Text>
                </Pressable>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedExpense)}
        onClose={closeModal}
        title="Detalle del gasto fijo"
      >
        {selectedExpense && (
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
                <Text style={[shared.label, { marginTop: 12 }]}>Categoria</Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.category}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <Picker.Item label="Selecciona categoria" value="" />
                    {categories.map((cat) => (
                      <Picker.Item
                        key={cat.id}
                        label={cat.name}
                        value={String(cat.id)}
                      />
                    ))}
                  </Picker>
                </View>
                <Text style={[shared.label, { marginTop: 12 }]}>Monto</Text>
                <TextInput
                  value={modalForm.amount}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, amount: value }))
                  }
                  keyboardType="numeric"
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>
                  Dia de vencimiento
                </Text>
                <TextInput
                  value={String(modalForm.dueDay)}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, dueDay: value }))
                  }
                  keyboardType="numeric"
                  style={shared.input}
                />
                <Text style={[shared.label, { marginTop: 12 }]}>
                  Metodo de pago
                </Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.paymentMethod}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({
                        ...prev,
                        paymentMethod: value,
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
                <Text style={[shared.label, { marginTop: 12 }]}>Proveedor</Text>
                <View style={local.pickerWrap}>
                  <Picker
                    selectedValue={modalForm.supplier}
                    onValueChange={(value) =>
                      setModalForm((prev) => ({ ...prev, supplier: value }))
                    }
                  >
                    <Picker.Item label="Selecciona proveedor" value="" />
                    {suppliers.map((supplier) => (
                      <Picker.Item
                        key={supplier.id}
                        label={supplier.name}
                        value={String(supplier.id)}
                      />
                    ))}
                  </Picker>
                </View>
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
              </View>
            ) : (
              <View>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Nombre: </Text>
                  {selectedExpense.name || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Categoria: </Text>
                  {categoryById.get(String(selectedExpense.category_id)) || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Monto: </Text>
                  {formatCurrency(selectedExpense.amount)}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Vence dia: </Text>
                  {selectedExpense.due_day || selectedExpense.dueDay || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Metodo: </Text>
                  {paymentById.get(String(selectedExpense.payment_method_id)) || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Proveedor: </Text>
                  {supplierById.get(String(selectedExpense.supplier_id)) || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Estado: </Text>
                  {selectedExpense.status || "-"}
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
                    onPress={() => openModalEdit(selectedExpense)}
                  >
                    <Text style={shared.buttonText}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.modalButton]}
                    onPress={async () => {
                      const removed = await handleDelete(selectedExpense.id);
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
    minWidth: 180,
  },
  totalCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
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

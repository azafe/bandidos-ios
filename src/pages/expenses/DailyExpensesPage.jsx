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

export default function DailyExpensesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    category_id: "",
  });
  const {
    items: expenses,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
  } = useApiResource("/v2/daily-expenses", filters);
  const { items: categories } = useApiResource("/v2/expense-categories");
  const { items: paymentMethods } = useApiResource("/v2/payment-methods");
  const { items: suppliers } = useApiResource("/v2/suppliers");
  const [form, setForm] = useState({
    date: today,
    category: "",
    description: "",
    amount: "",
    paymentMethod: "",
    supplier: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    date: today,
    category: "",
    description: "",
    amount: "",
    paymentMethod: "",
    supplier: "",
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

  const totalToday = expenses.reduce((sum, exp) => {
    if (exp.date === form.date) return sum + Number(exp.amount || 0);
    return sum;
  }, 0);

  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    const amountNumber = Number(form.amount);
    if (!amountNumber || amountNumber <= 0) {
      Alert.alert("Falta informacion", "Ingresa un monto valido.");
      return;
    }
    try {
      const payload = {
        date: form.date,
        category_id: form.category,
        description: form.description || "(Sin detalle)",
        amount: amountNumber,
        payment_method_id: form.paymentMethod,
        supplier_id: form.supplier || null,
      };
      if (editingId) {
        await updateItem(editingId, payload);
      } else {
        await createItem(payload);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el gasto.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      description: "",
      amount: "",
      supplier: "",
    }));
    setEditingId(null);
  }

  async function handleDelete(id) {
    const ok = await confirmDelete("¿Eliminar este gasto?");
    if (!ok) return false;
    try {
      await deleteItem(id);
      return true;
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo eliminar el gasto.");
      return false;
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setForm({
      date: expense.date || today,
      category: String(expense.category_id || ""),
      description: expense.description || "",
      amount: expense.amount ? String(expense.amount) : "",
      paymentMethod: String(expense.payment_method_id || ""),
      supplier: String(expense.supplier_id || ""),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      date: today,
      category: "",
      description: "",
      amount: "",
      paymentMethod: "",
      supplier: "",
    });
  }

  function openModalEdit(expense) {
    setModalForm({
      date: expense.date || today,
      category: String(expense.category_id || expense.category?.id || ""),
      description: expense.description || "",
      amount: expense.amount ? String(expense.amount) : "",
      paymentMethod: String(
        expense.payment_method_id || expense.payment_method?.id || ""
      ),
      supplier: String(expense.supplier_id || expense.supplier?.id || ""),
    });
    setIsEditingModal(true);
  }

  async function handleModalSave() {
    if (!selectedExpense) return;
    const amountNumber = Number(modalForm.amount);
    if (!amountNumber || amountNumber <= 0) {
      Alert.alert("Falta informacion", "Ingresa un monto valido.");
      return;
    }
    try {
      const payload = {
        date: modalForm.date,
        category_id: modalForm.category,
        description: modalForm.description || "(Sin detalle)",
        amount: amountNumber,
        payment_method_id: modalForm.paymentMethod,
        supplier_id: modalForm.supplier || null,
      };
      await updateItem(selectedExpense.id, payload);
      setSelectedExpense((prev) =>
        prev
          ? {
              ...prev,
              date: modalForm.date,
              category_id: modalForm.category,
              description: modalForm.description || "(Sin detalle)",
              amount: amountNumber,
              payment_method_id: modalForm.paymentMethod,
              supplier_id: modalForm.supplier || null,
            }
          : prev
      );
      setIsEditingModal(false);
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el gasto.");
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
            <Text style={shared.pageTitle}>Gastos diarios</Text>
            <Text style={shared.pageSubtitle}>
              Registra gastos del dia: shampoo, limpieza, snacks, etc.
            </Text>
          </View>
          <View style={local.filterRow}>
            <TextInput
              value={filters.from}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, from: value }))
              }
              placeholder="Desde (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              style={[shared.pillInput, local.filterInput]}
            />
            <TextInput
              value={filters.to}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, to: value }))
              }
              placeholder="Hasta (YYYY-MM-DD)"
              placeholderTextColor={colors.textMuted}
              style={[shared.pillInput, local.filterInput]}
            />
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
          </View>
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>
          {editingId ? "Editar gasto" : "Nuevo gasto"}
        </Text>
        <Text style={shared.cardSubtitle}>
          Completa los datos del gasto para el control de caja.
        </Text>

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
          <View style={local.formFieldFull}>
            <Text style={shared.label}>Descripcion</Text>
            <TextInput
              value={form.description}
              onChangeText={(value) => handleChange("description", value)}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Monto</Text>
            <TextInput
              value={form.amount}
              onChangeText={(value) => handleChange("amount", value)}
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
        </View>

        <View style={local.formActions}>
          <Pressable style={shared.buttonPrimary} onPress={handleSubmit}>
            <Text style={shared.buttonText}>
              {editingId ? "Guardar cambios" : "Guardar gasto"}
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
        <Text style={local.totalLabel}>Total del dia</Text>
        <Text style={local.totalValue}>{formatCurrency(totalToday)}</Text>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Listado de gastos</Text>
        <Text style={shared.cardSubtitle}>
          Gastos diarios registrados.
        </Text>

        {loading && <Text style={shared.cardSubtitle}>Cargando...</Text>}
        {error && (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        )}

        {expenses.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Sin gastos cargados.
          </Text>
        ) : (
          expenses.map((expense) => (
            <Pressable
              key={expense.id}
              style={local.listItem}
              onPress={() => setSelectedExpense(expense)}
            >
              <Text style={local.listTitle}>
                {expense.description || "(Sin detalle)"}
              </Text>
              <Text style={local.listMeta}>Fecha: {expense.date || "-"}</Text>
              <Text style={local.listMeta}>
                Categoria:{" "}
                {categoryById.get(String(expense.category_id)) || "-"}
              </Text>
              <Text style={local.listMeta}>
                Monto: {formatCurrency(expense.amount)}
              </Text>
              <Text style={local.listMeta}>
                Metodo: {paymentById.get(String(expense.payment_method_id)) || "-"}
              </Text>
              <Text style={local.listMeta}>
                Proveedor: {supplierById.get(String(expense.supplier_id)) || "-"}
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
        title="Detalle del gasto"
      >
        {selectedExpense && (
          <View>
            {isEditingModal ? (
              <View>
                <Text style={shared.label}>Fecha</Text>
                <TextInput
                  value={modalForm.date}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, date: value }))
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
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
                <Text style={[shared.label, { marginTop: 12 }]}>
                  Descripcion
                </Text>
                <TextInput
                  value={modalForm.description}
                  onChangeText={(value) =>
                    setModalForm((prev) => ({ ...prev, description: value }))
                  }
                  style={shared.input}
                />
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
              </View>
            ) : (
              <View>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Fecha: </Text>
                  {selectedExpense.date || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Categoria: </Text>
                  {categoryById.get(String(selectedExpense.category_id)) || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Descripcion: </Text>
                  {selectedExpense.description || "(Sin detalle)"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Monto: </Text>
                  {formatCurrency(selectedExpense.amount)}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Metodo: </Text>
                  {paymentById.get(String(selectedExpense.payment_method_id)) || "-"}
                </Text>
                <Text style={local.modalText}>
                  <Text style={local.modalLabel}>Proveedor: </Text>
                  {supplierById.get(String(selectedExpense.supplier_id)) || "-"}
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
  filterInput: {
    minWidth: 160,
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

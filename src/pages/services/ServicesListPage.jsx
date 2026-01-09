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
import { useNavigation } from "@react-navigation/native";
import { apiRequest } from "../../services/apiClient";
import { useApiResource } from "../../hooks/useApiResource";
import Modal from "../../components/ui/Modal";
import Screen from "../../components/layout/Screen";
import { colors, styles as shared } from "../../styles/native";

function parseSheetDate(dateStr) {
  if (!dateStr) return null;

  const raw = String(dateStr).trim();

  if (raw.includes("-")) {
    const parts = raw.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }

  const parts = raw.split("/");
  if (parts.length !== 3) return null;

  let [p1, p2, p3] = parts.map((v) => Number(v));
  if (!p1 || !p2 || !p3) return null;

  let day;
  let month;

  if (p1 > 12) {
    day = p1;
    month = p2;
  } else if (p2 > 12) {
    month = p1;
    day = p2;
  } else {
    day = p1;
    month = p2;
  }

  const year = p3 < 100 ? 2000 + p3 : p3;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

function confirmDelete(message) {
  return new Promise((resolve) => {
    Alert.alert("Confirmar", message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Eliminar", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

export default function ServicesListPage() {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return {
      from: `${yyyy}-${mm}-01`,
      to: now.toISOString().slice(0, 10),
      customer_id: "",
      pet_id: "",
      service_type_id: "",
      groomer_id: "",
    };
  });
  const { items: customers } = useApiResource("/v2/customers");
  const { items: pets } = useApiResource("/v2/pets");
  const { items: serviceTypes } = useApiResource("/v2/service-types");
  const { items: employees } = useApiResource("/v2/employees");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest("/v2/services", { params: filters });
        if (!active) return;
        setServices(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "No se pudieron cargar los servicios.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [filters]);

  const servicesWithDate = services.map((s) => ({
    ...s,
    _dateObj: parseSheetDate(s.date),
  }));

  const now = new Date();
  const servicesToday = servicesWithDate.filter((s) => {
    const d = s._dateObj;
    if (!d) return false;
    return d.toDateString() === now.toDateString();
  });

  const countToday = servicesToday.length;
  const totalToday = servicesToday.reduce(
    (acc, s) => acc + (Number(s.price) || 0),
    0
  );

  const countPeriod = servicesWithDate.length;
  const totalPeriod = servicesWithDate.reduce(
    (acc, s) => acc + (Number(s.price) || 0),
    0
  );

  const searchTerm = search.trim().toLowerCase();
  const filteredServices = servicesWithDate.filter((s) => {
    if (!searchTerm) return true;

    return [
      s.dogName,
      s.pet?.name,
      s.ownerName,
      s.customer?.name,
      s.type,
      s.service_type?.name,
      s.paymentMethod,
      s.payment_method?.name,
      s.groomer?.name || s.groomer,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(searchTerm));
  });

  const periodLabel = `${filters.from} → ${filters.to}`;

  function formatPrice(value) {
    if (value === null || value === undefined || value === "") return "-";
    return `$${Number(value).toLocaleString("es-AR")}`;
  }

  async function handleDelete(service) {
    const ok = await confirmDelete(
      `¿Eliminar el turno de ${service.dogName || service.pet?.name} (${service.date})?`
    );
    if (!ok) return false;

    try {
      await apiRequest(`/v2/services/${service.id}`, { method: "DELETE" });
      const data = await apiRequest("/v2/services", { params: filters });
      setServices(Array.isArray(data) ? data : data?.items || []);
      return true;
    } catch {
      Alert.alert("Error", "No se pudo eliminar el servicio.");
      return false;
    }
  }

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <View style={local.headerRow}>
          <View style={local.headerText}>
            <Text style={shared.pageTitle}>Servicios</Text>
            <Text style={shared.pageSubtitle}>
              Servicios registrados en Bandidos para el periodo seleccionado.
            </Text>
          </View>
          <Pressable
            style={[shared.buttonPrimary, local.headerButton]}
            onPress={() => navigation.navigate("ServiceForm", { id: null })}
          >
            <Text style={shared.buttonText}>+ Nuevo servicio</Text>
          </Pressable>
        </View>
      </View>

      {loading && <Text style={shared.cardSubtitle}>Cargando servicios...</Text>}
      {error && (
        <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
          {error}
        </Text>
      )}

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Filtros de periodo</Text>
        <View style={local.filterGrid}>
          <View style={local.filterField}>
            <Text style={shared.label}>Desde</Text>
            <TextInput
              value={filters.from}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, from: value }))
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={shared.input}
            />
          </View>
          <View style={local.filterField}>
            <Text style={shared.label}>Hasta</Text>
            <TextInput
              value={filters.to}
              onChangeText={(value) =>
                setFilters((prev) => ({ ...prev, to: value }))
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={shared.input}
            />
          </View>
          <View style={local.filterField}>
            <Text style={shared.label}>Cliente</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.customer_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    customer_id: value,
                    pet_id: "",
                  }))
                }
              >
                <Picker.Item label="Todos" value="" />
                {customers.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={String(c.id)} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={local.filterField}>
            <Text style={shared.label}>Mascota</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.pet_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, pet_id: value }))
                }
              >
                <Picker.Item label="Todas" value="" />
                {pets
                  .filter((p) =>
                    filters.customer_id
                      ? String(p.customer_id) === String(filters.customer_id)
                      : true
                  )
                  .map((p) => (
                    <Picker.Item key={p.id} label={p.name} value={String(p.id)} />
                  ))}
              </Picker>
            </View>
          </View>
          <View style={local.filterField}>
            <Text style={shared.label}>Servicio</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.service_type_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, service_type_id: value }))
                }
              >
                <Picker.Item label="Todos" value="" />
                {serviceTypes.map((t) => (
                  <Picker.Item key={t.id} label={t.name} value={String(t.id)} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={local.filterField}>
            <Text style={shared.label}>Groomer</Text>
            <View style={local.pickerWrap}>
              <Picker
                selectedValue={filters.groomer_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, groomer_id: value }))
                }
              >
                <Picker.Item label="Todos" value="" />
                {employees.map((emp) => (
                  <Picker.Item key={emp.id} label={emp.name} value={String(emp.id)} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      <View style={local.cardsRow}>
        <View style={[shared.card, local.summaryCard]}>
          <Text style={shared.cardTitle}>Servicios de hoy</Text>
          <Text style={local.summaryValue}>{countToday}</Text>
          <Text style={shared.cardSubtitle}>
            Ingresos de hoy:{" "}
            <Text style={local.summaryStrong}>
              ${totalToday.toLocaleString("es-AR")}
            </Text>
          </Text>
        </View>
        <View style={[shared.card, local.summaryCard]}>
          <Text style={shared.cardTitle}>Servicios del periodo</Text>
          <Text style={local.summaryValue}>{countPeriod}</Text>
          <Text style={shared.cardSubtitle}>
            Ingresos del periodo:{" "}
            <Text style={local.summaryStrong}>
              ${totalPeriod.toLocaleString("es-AR")}
            </Text>
          </Text>
          <Text style={local.summaryFoot}>Periodo: {periodLabel}</Text>
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Servicios de hoy</Text>
        <Text style={shared.cardSubtitle}>
          Turnos registrados en la fecha actual.
        </Text>

        {servicesToday.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            Hoy todavia no se registraron servicios.
          </Text>
        ) : (
          servicesToday.map((s) => (
            <Pressable
              key={s.id}
              style={local.listItem}
              onPress={() => setSelectedService(s)}
            >
              <View style={local.listHeader}>
                <Text style={local.listTitle}>
                  {s.dogName || s.pet?.name || "Servicio"}
                </Text>
                <View style={local.listActions}>
                  <Pressable
                    style={[shared.buttonSecondary, local.smallButton]}
                    onPress={() => navigation.navigate("ServiceForm", { id: s.id })}
                  >
                    <Text style={shared.buttonTextLight}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.smallButton]}
                    onPress={() => handleDelete(s)}
                  >
                    <Text style={shared.buttonTextLight}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={local.listMeta}>Fecha: {s.date || "-"}</Text>
              <Text style={local.listMeta}>
                Dueño: {s.ownerName || s.customer?.name || "-"}
              </Text>
              <Text style={local.listMeta}>
                Servicio: {s.type || s.service_type?.name || "-"}
              </Text>
              <Text style={local.listMeta}>
                Precio: {formatPrice(s.price)}
              </Text>
              <Text style={local.listMeta}>
                Metodo: {s.paymentMethod || s.payment_method?.name || "-"}
              </Text>
              <Text style={local.listMeta}>
                Groomer: {s.groomer?.name || s.groomer || "-"}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={shared.card}>
        <View style={local.searchHeader}>
          <View style={local.searchText}>
            <Text style={shared.cardTitle}>Servicios del periodo</Text>
            <Text style={shared.cardSubtitle}>
              Historial del periodo mostrado.
            </Text>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por perro, dueño, servicio..."
            placeholderTextColor={colors.textMuted}
            style={[shared.pillInput, local.searchInput]}
          />
        </View>

        {filteredServices.length === 0 ? (
          <Text style={[shared.cardSubtitle, local.centerText]}>
            No hay servicios que coincidan con la busqueda.
          </Text>
        ) : (
          filteredServices.map((s) => (
            <Pressable
              key={s.id}
              style={local.listItem}
              onPress={() => setSelectedService(s)}
            >
              <View style={local.listHeader}>
                <Text style={local.listTitle}>
                  {s.dogName || s.pet?.name || "Servicio"}
                </Text>
                <View style={local.listActions}>
                  <Pressable
                    style={[shared.buttonSecondary, local.smallButton]}
                    onPress={() => navigation.navigate("ServiceForm", { id: s.id })}
                  >
                    <Text style={shared.buttonTextLight}>Editar</Text>
                  </Pressable>
                  <Pressable
                    style={[shared.buttonDanger, local.smallButton]}
                    onPress={() => handleDelete(s)}
                  >
                    <Text style={shared.buttonTextLight}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={local.listMeta}>Fecha: {s.date || "-"}</Text>
              <Text style={local.listMeta}>
                Dueño: {s.ownerName || s.customer?.name || "-"}
              </Text>
              <Text style={local.listMeta}>
                Servicio: {s.type || s.service_type?.name || "-"}
              </Text>
              <Text style={local.listMeta}>
                Precio: {formatPrice(s.price)}
              </Text>
              <Text style={local.listMeta}>
                Metodo: {s.paymentMethod || s.payment_method?.name || "-"}
              </Text>
              <Text style={local.listMeta}>
                Groomer: {s.groomer?.name || s.groomer || "-"}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      <Modal
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        title="Detalle del servicio"
      >
        {selectedService && (
          <View>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Fecha: </Text>
              {selectedService.date || "-"}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Perro: </Text>
              {selectedService.dogName || selectedService.pet?.name || "-"}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Dueno: </Text>
              {selectedService.ownerName || selectedService.customer?.name || "-"}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Servicio: </Text>
              {selectedService.type ||
                selectedService.service_type?.name ||
                "-"}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Precio: </Text>
              {formatPrice(selectedService.price)}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Metodo de pago: </Text>
              {selectedService.paymentMethod ||
                selectedService.payment_method?.name ||
                "-"}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Groomer: </Text>
              {selectedService.groomer?.name || selectedService.groomer || "-"}
            </Text>
            <View style={local.modalActions}>
              <Pressable
                style={[shared.buttonPrimary, local.modalButton]}
                onPress={() => {
                  setSelectedService(null);
                  navigation.navigate("ServiceForm", { id: selectedService.id });
                }}
              >
                <Text style={shared.buttonText}>Editar</Text>
              </Pressable>
              <Pressable
                style={[shared.buttonDanger, local.modalButton]}
                onPress={async () => {
                  const removed = await handleDelete(selectedService);
                  if (removed) setSelectedService(null);
                }}
              >
                <Text style={shared.buttonTextLight}>Eliminar</Text>
              </Pressable>
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
  headerButton: {
    marginTop: 12,
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  filterField: {
    width: "48%",
    marginRight: "4%",
    marginBottom: 12,
  },
  pickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryCard: {
    flexBasis: "48%",
    marginRight: "4%",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  summaryStrong: {
    color: colors.text,
    fontWeight: "600",
  },
  summaryFoot: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  listItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
    marginRight: 12,
  },
  listActions: {
    flexDirection: "row",
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  listMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  searchHeader: {
    marginBottom: 12,
  },
  searchText: {
    marginBottom: 10,
  },
  searchInput: {
    minWidth: 220,
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

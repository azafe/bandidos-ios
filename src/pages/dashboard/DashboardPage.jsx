import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { apiRequest } from "../../services/apiClient";
import Modal from "../../components/ui/Modal";
import Screen from "../../components/layout/Screen";
import { colors, styles as shared } from "../../styles/native";

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to: now };
}

function pickNumber(summary, keys) {
  for (const key of keys) {
    if (summary?.[key] !== undefined) {
      return Number(summary[key]) || 0;
    }
  }
  return 0;
}

export default function DashboardPage() {
  const navigation = useNavigation();
  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

  const [range, setRange] = useState(() => {
    const { from, to } = getMonthRange();
    return { from: formatDate(from), to: formatDate(to) };
  });
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const summaryData = await apiRequest("/reports/summary", {
          params: { ...range, include_fixed: true },
        });
        const dailyData = await apiRequest("/reports/daily", {
          params: range,
        });
        if (!active) return;
        setSummary(summaryData || {});
        setDaily(Array.isArray(dailyData) ? dailyData : dailyData?.items || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "No se pudieron cargar los reportes.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReports();
    return () => {
      active = false;
    };
  }, [range]);

  const kpis = useMemo(() => {
    return {
      income: pickNumber(summary, ["total_income", "income", "totalIncome"]),
      expenses: pickNumber(summary, [
        "total_expenses",
        "expenses",
        "totalExpenses",
      ]),
      fixed: pickNumber(summary, [
        "total_fixed",
        "fixed_expenses",
        "fixedExpenses",
      ]),
      services: pickNumber(summary, [
        "total_services",
        "services",
        "serviceCount",
      ]),
    };
  }, [summary]);

  return (
    <Screen>
      <View style={shared.pageHeader}>
        <View style={local.headerRow}>
          <View style={local.headerText}>
            <Text style={shared.pageTitle}>Inicio</Text>
            <Text style={shared.pageSubtitle}>
              Resumen del negocio de Bandidos · {formattedDate}
            </Text>
          </View>
          <Pressable
            style={[shared.buttonPrimary, local.headerButton]}
            onPress={() => navigation.navigate("ServiceForm", { id: null })}
          >
            <Text style={shared.buttonText}>+ Registrar servicio</Text>
          </Pressable>
        </View>
      </View>

      <View style={local.kpiGrid}>
        <View style={[shared.card, local.kpiCard]}>
          <Text style={local.kpiLabel}>Ingresos del periodo</Text>
          <Text style={local.kpiValue}>
            ${kpis.income.toLocaleString("es-AR")}
          </Text>
        </View>
        <View style={[shared.card, local.kpiCard]}>
          <Text style={local.kpiLabel}>Gastos del periodo</Text>
          <Text style={local.kpiValue}>
            ${kpis.expenses.toLocaleString("es-AR")}
          </Text>
        </View>
        <View style={[shared.card, local.kpiCard]}>
          <Text style={local.kpiLabel}>Gastos fijos</Text>
          <Text style={local.kpiValue}>
            ${kpis.fixed.toLocaleString("es-AR")}
          </Text>
        </View>
        <View style={[shared.card, local.kpiCard]}>
          <Text style={local.kpiLabel}>Servicios del periodo</Text>
          <Text style={local.kpiValue}>{kpis.services}</Text>
        </View>
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Resumen diario</Text>
        <Text style={shared.cardSubtitle}>
          Reporte por dia para el rango seleccionado.
        </Text>

        <View style={local.formRow}>
          <View style={local.formField}>
            <Text style={shared.label}>Desde</Text>
            <TextInput
              value={range.from}
              onChangeText={(value) =>
                setRange((prev) => ({ ...prev, from: value }))
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={shared.input}
            />
          </View>
          <View style={local.formField}>
            <Text style={shared.label}>Hasta</Text>
            <TextInput
              value={range.to}
              onChangeText={(value) =>
                setRange((prev) => ({ ...prev, to: value }))
              }
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              style={shared.input}
            />
          </View>
        </View>

        {loading ? (
          <Text style={shared.cardSubtitle}>Cargando reportes...</Text>
        ) : error ? (
          <Text style={[shared.cardSubtitle, { color: colors.danger }]}>
            {error}
          </Text>
        ) : (
          <View style={local.list}>
            {daily.length === 0 ? (
              <Text style={[shared.cardSubtitle, local.centerText]}>
                No hay datos para el rango seleccionado.
              </Text>
            ) : (
              daily.map((row, index) => {
                const dateLabel = row.date || row.day || "-";
                const income =
                  row.income || row.total_income || row.totalIncome || 0;
                const expenses =
                  row.expenses ||
                  row.total_expenses ||
                  row.totalExpenses ||
                  0;
                const services = row.services || row.total_services || 0;
                return (
                  <Pressable
                    key={row.date || index}
                    style={local.listItem}
                    onPress={() =>
                      setSelectedReport({
                        dateLabel,
                        income,
                        expenses,
                        services,
                      })
                    }
                  >
                    <Text style={local.listTitle}>{dateLabel}</Text>
                    <Text style={local.listMeta}>
                      Ingresos: ${Number(income).toLocaleString("es-AR")}
                    </Text>
                    <Text style={local.listMeta}>
                      Gastos: ${Number(expenses).toLocaleString("es-AR")}
                    </Text>
                    <Text style={local.listMeta}>Servicios: {services}</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </View>

      <View style={shared.card}>
        <Text style={shared.cardTitle}>Accesos rapidos</Text>
        <Text style={shared.cardSubtitle}>Tareas frecuentes de Bandidos</Text>

        <View style={local.quickActions}>
          <View style={local.quickItem}>
            <View style={local.quickInfo}>
              <Text style={local.quickLabel}>Registrar nuevo servicio</Text>
              <Text style={local.quickHint}>Bano, corte o completo</Text>
            </View>
            <Pressable
              style={[shared.buttonPrimary, local.smallButton]}
              onPress={() => navigation.navigate("ServiceForm", { id: null })}
            >
              <Text style={shared.buttonText}>Ir</Text>
            </Pressable>
          </View>

          <View style={local.quickItem}>
            <View style={local.quickInfo}>
              <Text style={local.quickLabel}>Ver servicios</Text>
              <Text style={local.quickHint}>Historial de perros atendidos</Text>
            </View>
            <Pressable
              style={[shared.buttonSecondary, local.smallButton]}
              onPress={() => navigation.navigate("Services")}
            >
              <Text style={shared.buttonTextLight}>Abrir</Text>
            </Pressable>
          </View>

          <View style={local.quickItem}>
            <View style={local.quickInfo}>
              <Text style={local.quickLabel}>Registrar gasto diario</Text>
              <Text style={local.quickHint}>Shampoo, limpieza, snacks</Text>
            </View>
            <Pressable
              style={[shared.buttonSecondary, local.smallButton]}
              onPress={() => navigation.navigate("DailyExpenses")}
            >
              <Text style={shared.buttonTextLight}>Abrir</Text>
            </Pressable>
          </View>

          <View style={local.quickItem}>
            <View style={local.quickInfo}>
              <Text style={local.quickLabel}>Gastos fijos del mes</Text>
              <Text style={local.quickHint}>Alquiler, servicios, sueldos</Text>
            </View>
            <Pressable
              style={[shared.buttonSecondary, local.smallButton]}
              onPress={() => navigation.navigate("FixedExpenses")}
            >
              <Text style={shared.buttonTextLight}>Abrir</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Detalle del reporte diario"
      >
        {selectedReport && (
          <View>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Fecha: </Text>
              {selectedReport.dateLabel}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Ingresos: </Text>$
              {Number(selectedReport.income).toLocaleString("es-AR")}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Gastos: </Text>$
              {Number(selectedReport.expenses).toLocaleString("es-AR")}
            </Text>
            <Text style={local.modalText}>
              <Text style={local.modalLabel}>Servicios: </Text>
              {selectedReport.services}
            </Text>
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
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  kpiCard: {
    flexBasis: "48%",
    marginRight: "4%",
    marginBottom: 12,
  },
  kpiLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  kpiValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  formField: {
    width: "48%",
    marginRight: "4%",
    marginBottom: 12,
  },
  list: {
    marginTop: 12,
  },
  listItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listTitle: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 6,
  },
  listMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  centerText: {
    textAlign: "center",
  },
  quickActions: {
    marginTop: 12,
  },
  quickItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickInfo: {
    flex: 1,
    marginRight: 12,
  },
  quickLabel: {
    color: colors.text,
    fontWeight: "600",
  },
  quickHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  modalLabel: {
    fontWeight: "600",
    color: colors.text,
  },
  modalText: {
    color: colors.textMuted,
    marginBottom: 8,
  },
});

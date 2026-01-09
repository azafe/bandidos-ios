// src/components/navigation/Sidebar.jsx
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Image, StyleSheet, Text, View } from "react-native";
import logo from "../../assets/bandidos-logo.jpg";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Inicio", route: "Dashboard" },
  { label: "Servicios", route: "Services" },
  { label: "Clientes", route: "Customers" },
  { label: "Mascotas", route: "Pets" },
  { label: "Gastos diarios", route: "DailyExpenses" },
  { label: "Gastos fijos", route: "FixedExpenses" },
  { label: "Tipos de servicio", route: "ServiceTypes" },
  { label: "Metodos de pago", route: "PaymentMethods" },
  { label: "Categorias gastos", route: "ExpenseCategories" },
  { label: "Empleados", route: "Employees" },
  { label: "Proveedores", route: "Suppliers" },
];

export default function Sidebar(props) {
  const { navigation, user } = props;
  const { logout } = useAuth();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Image source={logo} style={styles.logoImg} resizeMode="cover" />
        </View>
        <View style={styles.brandText}>
          <Text style={styles.brandTitle}>Bandidos</Text>
          <Text style={styles.brandSubtitle}>Peluqueria Canina</Text>
        </View>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <DrawerItem
            key={item.route}
            label={item.label}
            onPress={() => navigation.navigate(item.route)}
            labelStyle={styles.navLabel}
          />
        ))}
        {user?.role === "admin" && (
          <DrawerItem
            label="Usuarios"
            onPress={() => navigation.navigate("Users")}
            labelStyle={styles.navLabel}
          />
        )}
      </View>

      <View style={styles.footer}>
        <DrawerItem
          label="Cerrar sesion"
          onPress={logout}
          labelStyle={styles.logoutLabel}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  brand: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0f1117",
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  brandText: {
    marginLeft: 12,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  nav: {
    paddingHorizontal: 4,
  },
  navLabel: {
    fontSize: 14,
  },
  footer: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  logoutLabel: {
    fontSize: 14,
    color: "#b91c1c",
  },
});

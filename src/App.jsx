// src/App.jsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, View } from "react-native";
import Sidebar from "./components/navigation/Sidebar";

import DashboardPage from "./pages/dashboard/DashboardPage";
import ServicesListPage from "./pages/services/ServicesListPage";
import ServiceFormPage from "./pages/services/ServiceFormPage";
import DailyExpensesPage from "./pages/expenses/DailyExpensesPage";
import FixedExpensesPage from "./pages/expenses/FixedExpensesPage";
import SuppliersPage from "./pages/suppliers/SuppliersPage";
import EmployeesPage from "./pages/employees/EmployeesPage";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import CustomersPage from "./pages/customers/CustomersPage";
import PetsPage from "./pages/pets/PetsPage";
import ServiceTypesPage from "./pages/catalog/ServiceTypesPage";
import PaymentMethodsPage from "./pages/catalog/PaymentMethodsPage";
import ExpenseCategoriesPage from "./pages/catalog/ExpenseCategoriesPage";
import UsersPage from "./pages/admin/UsersPage";

import { AuthProvider, useAuth } from "./context/AuthContext";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function AppDrawer() {
  const { user } = useAuth();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} user={user} />}
      screenOptions={{ headerShown: true }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardPage} options={{ title: "Inicio" }} />
      <Drawer.Screen name="Services" component={ServicesListPage} options={{ title: "Servicios" }} />
      <Drawer.Screen name="Customers" component={CustomersPage} options={{ title: "Clientes" }} />
      <Drawer.Screen name="Pets" component={PetsPage} options={{ title: "Mascotas" }} />
      <Drawer.Screen name="DailyExpenses" component={DailyExpensesPage} options={{ title: "Gastos diarios" }} />
      <Drawer.Screen name="FixedExpenses" component={FixedExpensesPage} options={{ title: "Gastos fijos" }} />
      <Drawer.Screen name="Employees" component={EmployeesPage} options={{ title: "Empleados" }} />
      <Drawer.Screen name="Suppliers" component={SuppliersPage} options={{ title: "Proveedores" }} />
      <Drawer.Screen
        name="ServiceTypes"
        component={ServiceTypesPage}
        options={{ title: "Tipos de servicio" }}
      />
      <Drawer.Screen
        name="PaymentMethods"
        component={PaymentMethodsPage}
        options={{ title: "Metodos de pago" }}
      />
      <Drawer.Screen
        name="ExpenseCategories"
        component={ExpenseCategoriesPage}
        options={{ title: "Categorias gastos" }}
      />
      {user?.role === "admin" && (
        <Drawer.Screen name="Users" component={UsersPage} options={{ title: "Usuarios" }} />
      )}
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordPage}
        options={{ title: "Recuperar clave" }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordPage}
        options={{ title: "Restablecer clave" }}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator>
          <Stack.Screen name="Main" component={AppDrawer} options={{ headerShown: false }} />
          <Stack.Screen
            name="ServiceForm"
            component={ServiceFormPage}
            options={{ title: "Servicio" }}
          />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export default App;

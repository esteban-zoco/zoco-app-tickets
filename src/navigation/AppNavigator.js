import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useAuth } from "../store/AuthContext";
import { TAB_BAR_STYLE } from "./tabBarStyle";
import Loading from "../components/Loading";
import AuthRequiredScreen from "../screens/auth/AuthRequiredScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import HomeScreen from "../screens/public/HomeScreen";
import SearchScreen from "../screens/public/SearchScreen";
import EventDetailScreen from "../screens/public/EventDetailScreen";
import BlogListScreen from "../screens/public/BlogListScreen";
import BlogDetailScreen from "../screens/public/BlogDetailScreen";
import ContactScreen from "../screens/public/ContactScreen";
import ProfileScreen from "../screens/public/ProfileScreen";
import ChangePasswordScreen from "../screens/public/ChangePasswordScreen";
import MyEventsScreen from "../screens/public/MyEventsScreen";
import MyEventDetailScreen from "../screens/public/MyEventDetailScreen";
import TransferAcceptScreen from "../screens/public/TransferAcceptScreen";
import OrganizerDashboardScreen from "../screens/organizer/OrganizerDashboardScreen";
import OrganizerEventsScreen from "../screens/organizer/OrganizerEventsScreen";
import OrganizerEventFormScreen from "../screens/organizer/OrganizerEventFormScreen";
import OrganizerOrdersScreen from "../screens/organizer/OrganizerOrdersScreen";
import OrganizerCouponsScreen from "../screens/organizer/OrganizerCouponsScreen";
import OrganizerSponsorsScreen from "../screens/organizer/OrganizerSponsorsScreen";
import OrganizerScannersScreen from "../screens/organizer/OrganizerScannersScreen";
import OrganizerSellersScreen from "../screens/organizer/OrganizerSellersScreen";
import OrganizerReportsScreen from "../screens/organizer/OrganizerReportsScreen";
import OrganizerTicketsScreen from "../screens/organizer/OrganizerTicketsScreen";
import OrganizerAttendanceScreen from "../screens/organizer/OrganizerAttendanceScreen";
import PaymentReturnScreen from "../screens/public/PaymentReturnScreen";

const RootStack = createNativeStackNavigator();
const PublicStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const MyEventsStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();
const OrganizerStack = createNativeStackNavigator();
const OrganizerRolesStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerTitleStyle: { fontFamily: "Montserrat_700Bold" },
  headerTintColor: colors.ink,
  headerShadowVisible: false,
  statusBarTranslucent: false,
};

const linking = {
  prefixes: [Linking.createURL("/"), "zoco-tickets://"],
  config: {
    screens: {
      PaymentReturn: "payment/:status",
    },
  },
};

const PublicStackScreen = () => (
  <PublicStack.Navigator screenOptions={screenOptions}>
    <PublicStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <PublicStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    <PublicStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Evento" }} />
    <PublicStack.Screen name="Blog" component={BlogListScreen} options={{ title: "Blog" }} />
    <PublicStack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ title: "Blog" }} />
    <PublicStack.Screen name="Contact" component={ContactScreen} options={{ title: "Contactanos" }} />
  </PublicStack.Navigator>
);

const SearchStackScreen = () => (
  <SearchStack.Navigator screenOptions={screenOptions}>
    <SearchStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
    <SearchStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Evento" }} />
  </SearchStack.Navigator>
);

const MyEventsStackScreen = () => (
  <MyEventsStack.Navigator screenOptions={screenOptions}>
    <MyEventsStack.Screen name="MyEvents" component={MyEventsScreen} options={{ headerShown: false }} />
    <MyEventsStack.Screen name="MyEventDetail" component={MyEventDetailScreen} options={{ title: "Evento" }} />
    <MyEventsStack.Screen name="TransferAccept" component={TransferAcceptScreen} options={{ title: "Transferencia" }} />
    <MyEventsStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    <MyEventsStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Cambiar contraseña" }} />
  </MyEventsStack.Navigator>
);

const AccountStackScreen = () => (
  <AccountStack.Navigator screenOptions={screenOptions}>
    <AccountStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    <AccountStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Cambiar contraseña" }} />
  </AccountStack.Navigator>
);

const OrganizerStackScreen = () => (
  <OrganizerStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <OrganizerStack.Screen name="OrganizerDashboard" component={OrganizerDashboardScreen} options={{ title: "Dashboard" }} />
    <OrganizerStack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} options={{ title: "Eventos" }} />
    <OrganizerStack.Screen name="OrganizerEventForm" component={OrganizerEventFormScreen} options={{ title: "Evento" }} />
    <OrganizerStack.Screen name="OrganizerOrders" component={OrganizerOrdersScreen} options={{ title: "Ordenes" }} />
    <OrganizerStack.Screen name="OrganizerCoupons" component={OrganizerCouponsScreen} options={{ title: "Cupones" }} />
    <OrganizerStack.Screen name="OrganizerSponsors" component={OrganizerSponsorsScreen} options={{ title: "Sponsors" }} />
    <OrganizerStack.Screen name="OrganizerScanners" component={OrganizerScannersScreen} options={{ title: "Scanners" }} />
    <OrganizerStack.Screen name="OrganizerSellers" component={OrganizerSellersScreen} options={{ title: "Sellers" }} />
    <OrganizerStack.Screen name="OrganizerReports" component={OrganizerReportsScreen} options={{ title: "Reportes" }} />
    <OrganizerStack.Screen name="OrganizerTickets" component={OrganizerTicketsScreen} options={{ title: "Tickets" }} />
    <OrganizerStack.Screen name="OrganizerAttendance" component={OrganizerAttendanceScreen} options={{ title: "Asistencia" }} />
  </OrganizerStack.Navigator>
);

const OrganizerRolesStackScreen = () => (
  <OrganizerRolesStack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
    <OrganizerRolesStack.Screen name="OrganizerScanners" component={OrganizerScannersScreen} options={{ title: "Escaneres" }} />
    <OrganizerRolesStack.Screen name="OrganizerSellers" component={OrganizerSellersScreen} options={{ title: "Vendedores" }} />
  </OrganizerRolesStack.Navigator>
);

const AuthStackScreen = () => (
  <AuthStack.Navigator screenOptions={screenOptions}>
    <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    <AuthStack.Screen name="Forgot" component={ForgotPasswordScreen} options={{ title: "Recuperar contraseña" }} />
  </AuthStack.Navigator>
);

const Tabs = () => {
  const { state } = useAuth();
  const isOrganizer = state.user?.role === "ORGANIZER";
  const tabIconMap = {
    HomeTab: "home-outline",
    SearchTab: "search-outline",
    MyEventsTab: "ticket-outline",
    AccountTab: "person-outline",
    OrganizerHomeTab: "home-outline",
    OrganizerAttendanceTab: "checkbox-outline",
    OrganizerRolesTab: "people-outline",
    OrganizerAccountTab: "person-outline",
  };

  return (
    <Tab.Navigator
      key={isOrganizer ? "organizer" : "public"}
      initialRouteName={isOrganizer ? "OrganizerHomeTab" : "HomeTab"}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: "#98A2B3",
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarItemStyle: {
          width: 48,
          paddingHorizontal: 0,
          marginHorizontal: 0,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarIcon: ({ color, size }) => {
          const iconSize = Math.max(20, size - 4);
          return <Ionicons name={tabIconMap[route.name]} size={iconSize} color={color} />;
        },
      })}
    >
      {isOrganizer ? (
        <>
          <Tab.Screen name="OrganizerHomeTab" component={OrganizerStackScreen} options={{ title: "Panel" }} />
          <Tab.Screen
            name="OrganizerAttendanceTab"
            component={state.isAuthenticated ? OrganizerAttendanceScreen : AuthRequiredScreen}
            options={{ title: "Asistencia" }}
          />
          <Tab.Screen
            name="OrganizerRolesTab"
            component={state.isAuthenticated ? OrganizerRolesStackScreen : AuthRequiredScreen}
            options={{ title: "Roles" }}
          />
          <Tab.Screen
            name="OrganizerAccountTab"
            component={state.isAuthenticated ? AccountStackScreen : AuthRequiredScreen}
            options={{ title: "Cuenta" }}
          />
        </>
      ) : (
        <>
          <Tab.Screen name="HomeTab" component={PublicStackScreen} options={{ title: "Inicio" }} />
          <Tab.Screen name="SearchTab" component={SearchStackScreen} options={{ title: "Buscar" }} />
          <Tab.Screen
            name="MyEventsTab"
            component={state.isAuthenticated ? MyEventsStackScreen : AuthRequiredScreen}
            options={{ title: "Mis eventos" }}
          />
          <Tab.Screen
            name="AccountTab"
            component={state.isAuthenticated ? AccountStackScreen : AuthRequiredScreen}
            options={{ title: "Cuenta" }}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { state } = useAuth();

  if (state.isLoading) return <Loading />;

  const initialRouteName = state.isAuthenticated ? "Main" : "Auth";
  const authOptions = state.isAuthenticated ? { presentation: "modal" } : undefined;

  return (
    <NavigationContainer linking={linking} key={state.isAuthenticated ? "auth" : "guest"}>
      <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
        <RootStack.Screen name="Main" component={Tabs} />
        <RootStack.Screen name="Auth" component={AuthStackScreen} options={authOptions} />
        <RootStack.Screen name="PaymentReturn" component={PaymentReturnScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

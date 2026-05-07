import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import EditExpenseScreen from "../screens/EditExpenseScreen";
import AIScreen from "../screens/AIScreen";
import AIChatScreen from "../screens/AIChatScreen";
import BudgetScreen from "../screens/BudgetScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CategoryScreen from "../screens/CategoryScreen";
import ExpenseListScreen from "../screens/ExpenseListScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: true, title: "New Transaction" }} />
            <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ headerShown: true, title: "Edit Transaction" }} />
            <Stack.Screen name="AI" component={AIScreen} options={{ headerShown: true, title: "AI Entry" }} />
            <Stack.Screen name="AIChat" component={AIChatScreen} options={{ headerShown: true, title: "AI Assistant" }} />
            <Stack.Screen name="Budget" component={BudgetScreen} options={{ headerShown: true, title: "Budget" }} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ headerShown: true, title: "Analytics" }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true, title: "Profile" }} />
            <Stack.Screen name="Categories" component={CategoryScreen} options={{ headerShown: true, title: "Categories" }} />
            <Stack.Screen name="ExpenseList" component={ExpenseListScreen} options={{ headerShown: true, title: "All Transactions" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}


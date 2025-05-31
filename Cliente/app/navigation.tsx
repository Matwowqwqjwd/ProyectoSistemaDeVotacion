/**
 * Root navigation component for the voting app.
 * Renders a bottom–tab navigator whose tabs vary by authenticated user role.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ProductScreen from '../screens/ProductScreen';
import ProfileScreen from '../screens/ProfileScreen';
import InventoryScreen from '../screens/InventoryScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import PanelCandidateScreen from '../screens/PanelCandidatoScreen';
import PanelVoterScreen from '../screens/PanelVotanteScreen';
import PanelAdministrativeScreen from '../screens/PanelAdministrativoScreen';
import AdminDashboardScreen from '../screens/PanelAdminScreen';
import CreateElectionScreen from '../screens/CrearEleccionScreen';
import EditElectionScreen from '../screens/EditarEleccionScreen';
import AddCandidateScreen from '../screens/AgregarCandidatoScreen';
import VoteScreen from '../screens/AgregarVotacionScreen';
import ElectionResultsScreen from '../screens/ResultadosVotacionesScreen';
import CandidateListScreen from '../screens/ListaCandidaturasScreen';

/* -------------------------------------------------------------------------- */
/*                              Type Declarations                             */
/* -------------------------------------------------------------------------- */

type UserRole = 'ADMIN' | 'CANDIDATE' | 'VOTER' | 'ADMINISTRATIVE' | null;

interface StoredUser {
  role: UserRole;
}

interface NavigationProps {
  /** Callback executed after local logout on native platforms. */
  onLogout: () => void;
}

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

/** Retrieve the stored user object from local / async storage. */
const fetchStoredUser = async (): Promise<StoredUser | null> => {
  const userJson =
    Platform.OS === 'web'
      ? localStorage.getItem('user')
      : await AsyncStorage.getItem('user');

  return userJson ? (JSON.parse(userJson) as StoredUser) : null;
};

/** Clear the stored user object from local / async storage. */
const clearStoredUser = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('user');
  } else {
    await AsyncStorage.removeItem('user');
  }
};

/* -------------------------------------------------------------------------- */
/*                           Constants & Mappings                             */
/* -------------------------------------------------------------------------- */

const Tab = createBottomTabNavigator();

/** Mapping between route labels and their icon names. */
const ICON_BY_ROUTE: Record<string, keyof typeof Ionicons.glyphMap> = {
  Panel: 'home',
  Productos: 'pricetags',
  Perfil: 'person',
  Inventario: 'cube',
  Usuarios: 'people',
  'Crear Eleccion': 'checkbox-outline',
  'Lista Elecciones': 'create-outline',
  'Asignar Candidato': 'add-circle-outline',
  'Realizar Votacion': 'checkmark-circle-outline',
  'Lista de candidaturas': 'list-outline',
  Resultados: 'bar-chart-outline',
};

/* -------------------------------------------------------------------------- */
/*                         Main Navigation Component                          */
/* -------------------------------------------------------------------------- */

export default function Navigation({ onLogout }: NavigationProps) {
  const [userRole, setUserRole] = useState<UserRole>(null);

  /* ------------------------------ Fetch role ----------------------------- */
  useEffect(() => {
    (async () => {
      const storedUser = await fetchStoredUser();
      setUserRole(storedUser?.role ?? null);
    })();
  }, []);

  /* --------------------------- Logout handling --------------------------- */
  const handleLogout = useCallback(async () => {
    const shouldLogout =
      Platform.OS === 'web'
        ? window.confirm('Do you want to log out of the application?')
        : true;

    if (!shouldLogout) return;

    await clearStoredUser();

    if (Platform.OS === 'web') {
      sessionStorage.setItem('logoutMessage', '🚪 You have logged out successfully.');
      window.location.reload();
    } else {
      onLogout();
    }
  }, [onLogout]);

  const renderLogoutButton = useCallback(
    () => (
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={18} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    ),
    [handleLogout],
  );

  /* ------------------------------- Render ------------------------------- */
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICON_BY_ROUTE[route.name] ?? 'help'} size={size} color={color} />
          ),
          headerRight: renderLogoutButton,
        })}
      >
        {/* Universal tabs */}
        {/* Uncomment if you ever need Home/Product/Inventory again */}
        {/* <Tab.Screen name="Inicio" component={HomeScreen} /> */}
        {/* <Tab.Screen name="Productos" component={ProductScreen} /> */}
        {/* <Tab.Screen name="Inventario" component={InventoryScreen} /> */}

        {/* Role-specific tabs */}
        {userRole === 'ADMIN' && (
          <>
            <Tab.Screen name="Panel" component={AdminDashboardScreen} />
            <Tab.Screen name="Usuarios" component={UserManagementScreen} />
            <Tab.Screen name="Crear Eleccion" component={CreateElectionScreen} />
            <Tab.Screen name="Lista Elecciones" component={EditElectionScreen} />
            <Tab.Screen name="Asignar Candidato" component={AddCandidateScreen} />
            <Tab.Screen name="Lista de candidaturas" component={CandidateListScreen} />
          </>
        )}

        {userRole === 'CANDIDATE' && (
          <>
            <Tab.Screen name="Panel" component={PanelCandidateScreen} />
            <Tab.Screen name="Lista de candidaturas" component={CandidateListScreen} />
          </>
        )}

        {userRole === 'VOTER' && (
          <>
            <Tab.Screen name="Panel" component={PanelVoterScreen} />
            <Tab.Screen name="Realizar Votacion" component={VoteScreen} />
          </>
        )}

        {userRole === 'ADMINISTRATIVE' && (
          <>
            <Tab.Screen name="Panel" component={PanelAdministrativeScreen} />
            <Tab.Screen name="Lista de candidaturas" component={CandidateListScreen} />
          </>
        )}

        {/* Always visible */}
        <Tab.Screen name="Resultados" component={ElectionResultsScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Styles                                   */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  logoutButton: {
    marginRight: 18,
    backgroundColor: '#e74c3c',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#e74c3c',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

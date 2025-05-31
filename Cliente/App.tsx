import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { InventarioProvider } from './screens/InventarioContext';
import AppNavigation from './app/navigation';
import LoginScreen from './screens/LoginScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Root component that handles session validation and global providers.
 * Displays either the navigation stack or the login screen based on session state.
 */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');

  /**
   * Verifies if a user session exists in local storage or AsyncStorage.
   * Sets login state accordingly.
   */
  useEffect(() => {
    const checkSession = async () => {
      const userData =
        Platform.OS === 'web'
          ? localStorage.getItem('usuario')
          : await AsyncStorage.getItem('usuario');

      if (userData) setIsLoggedIn(true);
    };

    checkSession();
  }, []);

  /**
   * Logs out the user by clearing login state and showing feedback message.
   */
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLogoutMessage('🚪 You have successfully logged out');

    setTimeout(() => setLogoutMessage(''), 3000);
  };

  return (
    <InventarioProvider>
      <View style={styles.container}>
        {logoutMessage !== '' && (
          <View style={styles.flashMessage}>
            <Text style={styles.flashMessageText}>{logoutMessage}</Text>
          </View>
        )}

        {isLoggedIn ? (
          <AppNavigation onLogout={handleLogout} />
        ) : (
          <LoginScreen navigation={{ replace: () => setIsLoggedIn(true) }} />
        )}
      </View>
    </InventarioProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flashMessage: {
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 6,
    margin: 10,
    borderColor: '#c3e6cb',
    borderWidth: 1,
  },
  flashMessageText: {
    color: '#155724',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { globalStyles, colors } from '../styles';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={globalStyles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.icon}>🌾</Text>
        <Text style={styles.title}>AgriSmart</Text>
        <Text style={styles.subtitle}>Farm Management System</Text>

        <TextInput placeholderTextColor="#666"
          style={globalStyles.input}
          placeholder="Email"
          placeholderTextColor={colors.textHint}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput placeholderTextColor="#666"
          style={[globalStyles.input, styles.lastInput]}
          placeholder="Password"
          placeholderTextColor={colors.textHint}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={globalStyles.buttonPrimary}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={globalStyles.buttonPrimaryText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = {
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  icon: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  lastInput: {
    marginBottom: 20,
  },
  registerLink: {
    textAlign: 'center',
    marginTop: 20,
    color: '#2e7d32',
    fontSize: 16,
  },
};

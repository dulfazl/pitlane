import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../../src/api';
import { Button, ErrorText, Input, Label } from '../../src/components/ui';
import { useSession } from '../../src/session';
import { colors, spacing } from '../../src/theme';

export default function StaffLogin() {
  const { loginStaff } = useSession();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!pin.trim()) {
      setError('Enter the staff PIN');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await loginStaff(pin.trim());
      router.replace('/staff');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing(16), paddingBottom: insets.bottom + spacing(6) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require('../../assets/pitlane-mark.png')} style={styles.mark} resizeMode="contain" />
        <Text style={styles.heading}>Staff Access</Text>
        <Text style={styles.sub}>Manage jobs, update progress, keep customers posted.</Text>

        <View style={{ marginTop: spacing(8) }}>
          <Label>Staff PIN</Label>
          <Input
            value={pin}
            onChangeText={(v) => {
              setPin(v);
              if (error) setError('');
            }}
            placeholder="••••"
            keyboardType="number-pad"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={submit}
          />
        </View>

        <View style={{ marginTop: spacing(3), minHeight: 22 }}>
          <ErrorText>{error}</ErrorText>
        </View>

        <Button title="ENTER WORKSHOP" onPress={submit} loading={busy} />

        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>‹ Back to customer login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing(6) },
  mark: { width: 84, height: 84, alignSelf: 'center', marginBottom: spacing(5) },
  heading: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  sub: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing(2) },
  backLink: { alignSelf: 'center', padding: spacing(4), marginTop: spacing(2) },
  backLinkText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});

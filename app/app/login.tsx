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
import { ApiError } from '../src/api';
import { Button, ErrorText, Input, Label } from '../src/components/ui';
import { useSession } from '../src/session';
import { colors, radius, spacing } from '../src/theme';

export default function Login() {
  const { loginCustomer } = useSession();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!identifier.trim()) {
      setError('Enter your phone number or vehicle number');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await loginCustomer(identifier);
      router.replace('/garage');
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
        <Image source={require('../assets/pitlane-wordmark.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.form}>
          <Text style={styles.heading}>Track your car</Text>
          <Text style={styles.sub}>
            Follow every step of your service — live from the workshop floor.
          </Text>

          <View style={{ marginTop: spacing(6) }}>
            <Label>Phone number or vehicle number</Label>
            <Input
              value={identifier}
              onChangeText={(v) => {
                setIdentifier(v);
                if (error) setError('');
              }}
              placeholder="98470 12345  or  KL 18 AB 1234"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={submit}
            />
          </View>

          <View style={{ marginTop: spacing(3), minHeight: 22 }}>
            <ErrorText>{error}</ErrorText>
          </View>

          <Button title="TRACK MY CAR" onPress={submit} loading={busy} />

          <Text style={styles.hint}>
            No password needed — use the phone number you registered at the workshop.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable onPress={() => router.push('/staff/login')} style={styles.staffLink}>
          <Text style={styles.staffLinkText}>PITLANE staff? Sign in here</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing(6) },
  logo: { width: 250, height: 46, alignSelf: 'center' },
  form: { marginTop: spacing(12) },
  heading: { color: colors.white, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing(2) },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing(4), textAlign: 'center' },
  staffLink: {
    alignSelf: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radius.pill,
  },
  staffLinkText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});

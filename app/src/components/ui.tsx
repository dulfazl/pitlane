import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'danger' && styles.buttonDanger,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.bg : colors.orange} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            isPrimary && { color: '#000000' },
            variant === 'ghost' && { color: colors.orange },
            variant === 'danger' && { color: colors.red },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <Text style={styles.error}>{children}</Text>;
}

export function Plate({ reg }: { reg: string }) {
  return (
    <View style={styles.plate}>
      <Text style={styles.plateText}>{reg}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'orange',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'orange' | 'green' | 'neutral';
}) {
  const activeColor = tone === 'green' ? colors.green : tone === 'neutral' ? colors.muted : colors.orange;
  const activeBg = tone === 'green' ? colors.greenDim : tone === 'neutral' ? colors.surface2 : colors.orangeDim;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, active && { backgroundColor: activeBg, borderColor: activeColor }]}
    >
      <Text style={[styles.chipText, active && { color: activeColor }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing(10) }}>
      <ActivityIndicator size="large" color={colors.orange} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(5),
  },
  buttonPrimary: { backgroundColor: colors.orange },
  buttonGhost: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonDanger: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  buttonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing(4),
    fontSize: 16,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing(2),
  },
  error: { color: colors.red, fontSize: 14, lineHeight: 20 },
  plate: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    backgroundColor: '#161616',
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
  },
  plateText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
  },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.orange },
});

import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, formatDateTime, formatMoney, formatReg, JobDetail } from '../../../src/api';
import { Button, Card, Chip, ErrorText, Input, Label, Loading, Plate } from '../../../src/components/ui';
import { useSession } from '../../../src/session';
import { colors, radius, spacing } from '../../../src/theme';

export default function StaffJob() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hydrated, staffPin } = useSession();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState('');
  const [updateText, setUpdateText] = useState('');
  const [newTask, setNewTask] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setJob(await api.job(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load job');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!hydrated) return <Loading />;
  if (!staffPin) return <Redirect href="/staff/login" />;

  async function run(action: () => Promise<JobDetail>) {
    setBusy(true);
    setError('');
    try {
      setJob(await action());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  const lastIndex = job ? job.stages.length - 1 : 5;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing(3) }]}>
        <Pressable onPress={() => router.back()} style={{ width: 64 }}>
          <Text style={styles.backText}>‹ Board</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Manage Job #{id}</Text>
        <View style={{ width: 64 }} />
      </View>

      {!job && !error ? <Loading /> : null}

      {job ? (
        <ScrollView
          contentContainerStyle={{ padding: spacing(5), paddingBottom: insets.bottom + spacing(10) }}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.service}>{job.service_type}</Text>
                <Text style={styles.meta}>
                  {job.make} {job.model} · {job.customer_name} · {job.customer_phone}
                </Text>
                {job.cost_estimate ? (
                  <Text style={styles.meta}>Estimate: {formatMoney(job.cost_estimate)}</Text>
                ) : null}
              </View>
              <Plate reg={formatReg(job.reg_no)} />
            </View>
          </Card>

          <View style={{ marginTop: spacing(3), minHeight: 22 }}>
            <ErrorText>{error}</ErrorText>
          </View>

          <View style={styles.section}>
            <Label>Stage</Label>
            <View style={styles.stageChips}>
              {job.stages.map((s, i) => (
                <Chip
                  key={s.key}
                  label={`${i + 1}. ${s.label}`}
                  active={i === job.stage_index}
                  tone={i === lastIndex && i === job.stage_index ? 'green' : 'orange'}
                  onPress={() => {
                    if (i === job.stage_index) return;
                    run(() => api.staff.setStage(staffPin, job.id, i));
                  }}
                />
              ))}
            </View>
            {job.stage_index < lastIndex ? (
              <Button
                title={`ADVANCE → ${job.stages[job.stage_index + 1].label.toUpperCase()}`}
                onPress={() => run(() => api.staff.setStage(staffPin, job.id, job.stage_index + 1))}
                loading={busy}
                style={{ marginTop: spacing(3) }}
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <Label>
              Checklist · {job.tasks.filter((t) => t.done).length}/{job.tasks.length}
            </Label>
            <Card style={{ gap: spacing(3) }}>
              {job.tasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => run(() => api.staff.setTaskDone(staffPin, task.id, task.done !== 1))}
                  style={styles.taskRow}
                >
                  <View style={[styles.taskBox, task.done === 1 && styles.taskBoxDone]}>
                    {task.done === 1 ? <Text style={styles.taskCheck}>✓</Text> : null}
                  </View>
                  <Text style={[styles.taskTitle, task.done === 1 && styles.taskTitleDone]}>{task.title}</Text>
                </Pressable>
              ))}
              <View style={styles.addTaskRow}>
                <Input
                  value={newTask}
                  onChangeText={setNewTask}
                  placeholder="Add a task…"
                  style={{ flex: 1, minHeight: 44 }}
                  onSubmitEditing={() => {
                    if (!newTask.trim()) return;
                    run(() => api.staff.addTask(staffPin, job.id, newTask.trim()));
                    setNewTask('');
                  }}
                />
                <Pressable
                  onPress={() => {
                    if (!newTask.trim()) return;
                    run(() => api.staff.addTask(staffPin, job.id, newTask.trim()));
                    setNewTask('');
                  }}
                  style={styles.addBtn}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Label>Post an update for the customer</Label>
            <Card style={{ gap: spacing(3) }}>
              <Input
                value={updateText}
                onChangeText={setUpdateText}
                placeholder="e.g. First ceramic layer applied, curing overnight…"
                multiline
                style={{ minHeight: 80, paddingTop: spacing(3), textAlignVertical: 'top' }}
              />
              <Button
                title="POST UPDATE"
                loading={busy}
                onPress={() => {
                  const message = updateText.trim();
                  if (!message) return;
                  run(() => api.staff.postUpdate(staffPin, job.id, message));
                  setUpdateText('');
                }}
              />
            </Card>
          </View>

          <View style={styles.section}>
            <Label>Update history</Label>
            <View style={{ gap: spacing(3) }}>
              {job.updates.map((u) => (
                <Card key={u.id}>
                  <View style={styles.updateHead}>
                    <Text style={styles.updateStage}>{job.stages[u.stage_index]?.label}</Text>
                    <Text style={styles.updateTime}>{formatDateTime(u.created_at)}</Text>
                  </View>
                  <Text style={styles.updateMsg}>{u.message}</Text>
                </Card>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: { color: colors.orange, fontSize: 16, fontWeight: '700' },
  headerTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  titleRow: { flexDirection: 'row', gap: spacing(3), alignItems: 'flex-start' },
  service: { color: colors.white, fontSize: 18, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  section: { marginTop: spacing(5) },
  stageChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  taskBox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBoxDone: { backgroundColor: colors.orange, borderColor: colors.orange },
  taskCheck: { color: '#000000', fontSize: 13, fontWeight: '900', lineHeight: 15 },
  taskTitle: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
  taskTitleDone: { color: colors.muted, textDecorationLine: 'line-through' },
  addTaskRow: { flexDirection: 'row', gap: spacing(2), alignItems: 'center' },
  addBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: colors.orange, fontSize: 14, fontWeight: '800' },
  updateHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing(2) },
  updateStage: { color: colors.orange, fontSize: 11, fontWeight: '800' },
  updateTime: { color: colors.muted, fontSize: 11 },
  updateMsg: { color: colors.text, fontSize: 14, lineHeight: 21 },
});

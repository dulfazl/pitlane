import { Redirect, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { api, Customer, formatReg, Vehicle } from '../../src/api';
import { Button, Card, Chip, ErrorText, Input, Label, Loading } from '../../src/components/ui';
import { useSession } from '../../src/session';
import { colors, radius, spacing } from '../../src/theme';

type PickedCustomer = Customer & { vehicle_count?: number };

export default function NewJob() {
  const { hydrated, staffPin } = useSession();
  const insets = useSafeAreaInsets();

  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // step 1 — customer
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PickedCustomer[]>([]);
  const [customer, setCustomer] = useState<PickedCustomer | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // step 2 — vehicle
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [creatingVehicle, setCreatingVehicle] = useState(false);
  const [reg, setReg] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');

  // step 3 — job
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [delivery, setDelivery] = useState('');
  const [cost, setCost] = useState('');
  const [tasksText, setTasksText] = useState('');

  useEffect(() => {
    api.meta().then((m) => setServiceTypes(m.service_types)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!staffPin || customer || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.staff.customers(staffPin, query.trim()).then((r) => setResults(r.customers)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query, customer, staffPin]);

  useEffect(() => {
    if (!staffPin || !customer) {
      setVehicles([]);
      setVehicle(null);
      return;
    }
    api.staff
      .customerOverview(staffPin, customer.id)
      .then((o) => {
        setVehicles(o.vehicles);
        setCreatingVehicle(o.vehicles.length === 0);
      })
      .catch(() => {});
  }, [customer, staffPin]);

  if (!hydrated) return <Loading />;
  if (!staffPin) return <Redirect href="/staff/login" />;

  async function createCustomer() {
    setBusy(true);
    setError('');
    try {
      const created = await api.staff.createCustomer(staffPin!, { name: newName, phone: newPhone });
      setCustomer(created);
      setCreatingCustomer(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create customer');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!customer) return setError('Pick or create a customer first');
    let vehicleId = vehicle?.id;
    setBusy(true);
    setError('');
    try {
      if (!vehicleId) {
        if (!reg || !make || !model) {
          setError('Fill in the vehicle registration, make and model');
          setBusy(false);
          return;
        }
        const created = await api.staff.createVehicle(staffPin!, {
          customer_id: customer.id,
          reg_no: reg,
          make,
          model,
          year: year || undefined,
          color: color || undefined,
        });
        vehicleId = created.id;
      }
      if (!serviceType) {
        setError('Pick a service type');
        setBusy(false);
        return;
      }
      const job = await api.staff.createJob(staffPin!, {
        vehicle_id: vehicleId,
        service_type: serviceType,
        description: description || undefined,
        estimated_delivery: delivery || undefined,
        cost_estimate: cost ? Number(cost.replace(/\D/g, '')) : undefined,
        tasks: tasksText.split('\n').map((t) => t.trim()).filter(Boolean),
      });
      router.replace(`/staff/job/${job.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create job');
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing(3) }]}>
        <Pressable onPress={() => router.back()} style={{ width: 64 }}>
          <Text style={styles.backText}>‹ Board</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Job</Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing(5), paddingBottom: insets.bottom + spacing(10) }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — customer */}
        <Label>1 · Customer</Label>
        <Card style={{ gap: spacing(3) }}>
          {customer ? (
            <View style={styles.pickedRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickedName}>{customer.name}</Text>
                <Text style={styles.pickedMeta}>{customer.phone}</Text>
              </View>
              <Pressable onPress={() => setCustomer(null)}>
                <Text style={styles.changeLink}>Change</Text>
              </Pressable>
            </View>
          ) : creatingCustomer ? (
            <>
              <Input value={newName} onChangeText={setNewName} placeholder="Customer name" />
              <Input
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="10-digit phone number"
                keyboardType="phone-pad"
              />
              <View style={{ flexDirection: 'row', gap: spacing(2) }}>
                <Button title="SAVE CUSTOMER" onPress={createCustomer} loading={busy} style={{ flex: 1 }} />
                <Button title="CANCEL" variant="ghost" onPress={() => setCreatingCustomer(false)} />
              </View>
            </>
          ) : (
            <>
              <Input
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or phone…"
                autoCorrect={false}
              />
              {results.map((c) => (
                <Pressable key={c.id} onPress={() => setCustomer(c)} style={styles.resultRow}>
                  <Text style={styles.pickedName}>{c.name}</Text>
                  <Text style={styles.pickedMeta}>
                    {c.phone} · {c.vehicle_count} vehicle{c.vehicle_count === 1 ? '' : 's'}
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setCreatingCustomer(true)}>
                <Text style={styles.changeLink}>+ New customer</Text>
              </Pressable>
            </>
          )}
        </Card>

        {/* Step 2 — vehicle */}
        {customer ? (
          <View style={{ marginTop: spacing(5) }}>
            <Label>2 · Vehicle</Label>
            <Card style={{ gap: spacing(3) }}>
              {!creatingVehicle && vehicles.length > 0 ? (
                <>
                  {vehicles.map((v) => (
                    <Pressable
                      key={v.id}
                      onPress={() => setVehicle(v)}
                      style={[styles.resultRow, vehicle?.id === v.id && styles.resultRowActive]}
                    >
                      <Text style={styles.pickedName}>
                        {formatReg(v.reg_no)} — {v.make} {v.model}
                      </Text>
                      <Text style={styles.pickedMeta}>{[v.year, v.color].filter(Boolean).join(' · ')}</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => { setCreatingVehicle(true); setVehicle(null); }}>
                    <Text style={styles.changeLink}>+ Different vehicle</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Input value={reg} onChangeText={setReg} placeholder="Registration (KL 18 AB 1234)" autoCapitalize="characters" />
                  <Input value={make} onChangeText={setMake} placeholder="Make (Hyundai)" />
                  <Input value={model} onChangeText={setModel} placeholder="Model (Creta)" />
                  <View style={{ flexDirection: 'row', gap: spacing(2) }}>
                    <Input value={year} onChangeText={setYear} placeholder="Year" keyboardType="number-pad" style={{ flex: 1 }} />
                    <Input value={color} onChangeText={setColor} placeholder="Colour" style={{ flex: 2 }} />
                  </View>
                  {vehicles.length > 0 ? (
                    <Pressable onPress={() => setCreatingVehicle(false)}>
                      <Text style={styles.changeLink}>‹ Pick an existing vehicle</Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </Card>
          </View>
        ) : null}

        {/* Step 3 — job details */}
        {customer ? (
          <View style={{ marginTop: spacing(5) }}>
            <Label>3 · Service details</Label>
            <Card style={{ gap: spacing(3) }}>
              <View style={styles.typeChips}>
                {serviceTypes.map((t) => (
                  <Chip key={t} label={t} active={serviceType === t} onPress={() => setServiceType(t)} />
                ))}
              </View>
              <Input
                value={description}
                onChangeText={setDescription}
                placeholder="Job description / customer notes…"
                multiline
                style={{ minHeight: 70, paddingTop: spacing(3), textAlignVertical: 'top' }}
              />
              <View style={{ flexDirection: 'row', gap: spacing(2) }}>
                <Input value={delivery} onChangeText={setDelivery} placeholder="Est. delivery (2026-06-20)" style={{ flex: 3 }} />
                <Input value={cost} onChangeText={setCost} placeholder="₹ Estimate" keyboardType="number-pad" style={{ flex: 2 }} />
              </View>
              <Input
                value={tasksText}
                onChangeText={setTasksText}
                placeholder={'Checklist — one task per line\nWash & decontamination\nPaint correction'}
                multiline
                style={{ minHeight: 90, paddingTop: spacing(3), textAlignVertical: 'top' }}
              />
            </Card>

            <View style={{ marginTop: spacing(3), minHeight: 22 }}>
              <ErrorText>{error}</ErrorText>
            </View>
            <Button title="CREATE JOB" onPress={submit} loading={busy} />
          </View>
        ) : (
          <View style={{ marginTop: spacing(3), minHeight: 22 }}>
            <ErrorText>{error}</ErrorText>
          </View>
        )}
      </ScrollView>
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
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  pickedName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  pickedMeta: { color: colors.muted, fontSize: 13, marginTop: 2 },
  changeLink: { color: colors.orange, fontSize: 14, fontWeight: '700', paddingVertical: spacing(1) },
  resultRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing(3),
  },
  resultRowActive: { borderColor: colors.orange, backgroundColor: colors.orangeDim },
  typeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
});

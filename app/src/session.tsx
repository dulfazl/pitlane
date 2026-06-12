import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, Customer, Overview } from './api';

type Session = {
  hydrated: boolean;
  customer: Customer | null;
  staffPin: string | null;
  loginCustomer: (identifier: string) => Promise<Overview>;
  logoutCustomer: () => void;
  loginStaff: (pin: string) => Promise<void>;
  logoutStaff: () => void;
};

const SessionContext = createContext<Session | null>(null);

const CUSTOMER_KEY = 'pitlane.customer';
const STAFF_KEY = 'pitlane.staffPin';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [staffPin, setStaffPin] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedCustomer, storedPin] = await Promise.all([
          AsyncStorage.getItem(CUSTOMER_KEY),
          AsyncStorage.getItem(STAFF_KEY),
        ]);
        if (storedCustomer) setCustomer(JSON.parse(storedCustomer));
        if (storedPin) setStaffPin(storedPin);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const value = useMemo<Session>(
    () => ({
      hydrated,
      customer,
      staffPin,
      loginCustomer: async (identifier: string) => {
        const overview = await api.login(identifier);
        setCustomer(overview.customer);
        AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(overview.customer));
        return overview;
      },
      logoutCustomer: () => {
        setCustomer(null);
        AsyncStorage.removeItem(CUSTOMER_KEY);
      },
      loginStaff: async (pin: string) => {
        await api.staff.login(pin);
        setStaffPin(pin);
        AsyncStorage.setItem(STAFF_KEY, pin);
      },
      logoutStaff: () => {
        setStaffPin(null);
        AsyncStorage.removeItem(STAFF_KEY);
      },
    }),
    [hydrated, customer, staffPin]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

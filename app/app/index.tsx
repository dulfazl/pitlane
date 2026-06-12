import { Redirect } from 'expo-router';
import React from 'react';
import { Loading } from '../src/components/ui';
import { useSession } from '../src/session';

export default function Index() {
  const { hydrated, customer } = useSession();
  if (!hydrated) return <Loading />;
  return <Redirect href={customer ? '/garage' : '/login'} />;
}

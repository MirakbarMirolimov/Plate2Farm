import { Redirect } from 'expo-router';

export default function Index() {
  // Always start with onboarding - _layout.jsx will handle the rest
  return <Redirect href="/onboarding" />;
}

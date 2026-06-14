import { StatusBar } from 'expo-status-bar';
import { CaseStoreProvider } from './src/state/CaseStore';
import { CalculatorScreen } from './src/screens/CalculatorScreen';

export default function App() {
  return (
    <CaseStoreProvider>
      <StatusBar style="dark" />
      <CalculatorScreen />
    </CaseStoreProvider>
  );
}

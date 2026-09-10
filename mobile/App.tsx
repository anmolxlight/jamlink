import { Text, View } from 'react-native';

// ponytail: temporary crash isolation build, full UI saved at /tmp/App.full.tsx
export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>JamLink test 0.1.6</Text>
      <Text style={{ color: '#1DB954', marginTop: 8 }}>If you see this, the binary opens.</Text>
    </View>
  );
}

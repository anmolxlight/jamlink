import { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Feed from './src/screens/Feed';
import JamDetail from './src/screens/JamDetail';
import Login from './src/screens/Login';
import Post from './src/screens/Post';
import Profile from './src/screens/Profile';
import Search from './src/screens/Search';
import { supabase } from './src/lib/supabase';
import { colors, spacing, styles } from './src/theme';

type Tab = 'feed' | 'search' | 'post' | 'profile';

const TABS: { key: Tab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'search', label: 'Search' },
  { key: 'post', label: 'Post' },
  { key: 'profile', label: 'Profile' },
];

// ponytail: tab state + optional overlay is the whole router; react-navigation is overkill for 4 tabs
export default function App() {
  const [tab, setTab] = useState<Tab>('feed');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  async function random() {
    const sb = supabase();
    if (!sb) return;
    const { data } = await sb.from('jams').select('id').eq('is_open', true).limit(100);
    // ponytail: guard here, not in Feed, so every caller of random() gets the same honest answer
    if (!data?.length) {
      Alert.alert('No open jams yet', 'Nothing is running right now. Post the first one.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Post a jam', onPress: () => goTab('post') },
      ]);
      return;
    }
    setDetailId((data as { id: string }[])[Math.floor(Math.random() * data.length)].id);
  }

  function goTab(t: Tab) {
    setShowLogin(false);
    setDetailId(null);
    setTab(t);
  }

  function back() {
    if (showLogin) setShowLogin(false);
    else setDetailId(null);
  }

  const tabLabel = TABS.find((t) => t.key === tab)?.label ?? 'Feed';
  const overlay = showLogin || detailId !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <Text style={styles.title}>JamLink</Text>
        {overlay ? (
          <TouchableOpacity
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel={`Back to ${tabLabel}`}
            style={styles.backButton}>
            <Text style={styles.backText}>{`← Back to ${tabLabel}`}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {/* ponytail: no outer ScrollView, each screen owns its scroll + refresh */}
      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        {showLogin ? (
          <Login onDone={() => setShowLogin(false)} />
        ) : detailId ? (
          <JamDetail id={detailId} />
        ) : tab === 'feed' ? (
          <Feed onOpen={setDetailId} onRandom={random} onPost={() => goTab('post')} />
        ) : tab === 'search' ? (
          <Search onOpen={setDetailId} onPost={() => goTab('post')} />
        ) : tab === 'post' ? (
          <Post onDone={setDetailId} onLogin={() => setShowLogin(true)} />
        ) : (
          <Profile onOpen={setDetailId} onLogin={() => setShowLogin(true)} onPost={() => goTab('post')} />
        )}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const selected = !overlay && tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => goTab(t.key)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t.label} tab`}
              style={styles.tabItem}>
              <Text style={[styles.tabLabel, { color: selected ? colors.accent : colors.muted, fontWeight: selected ? 'bold' : 'normal' }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

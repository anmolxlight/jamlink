import { useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Feed from './src/screens/Feed';
import JamDetail from './src/screens/JamDetail';
import Login from './src/screens/Login';
import Post from './src/screens/Post';
import Profile from './src/screens/Profile';
import Search from './src/screens/Search';
import { supabase } from './src/lib/supabase';
import { colors, styles, typo } from './src/theme';

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
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      {/* minimal split nav: wordmark left, the single live control right */}
      <View style={styles.nav}>
        <View style={styles.row}>
          <View style={styles.navDot} />
          <Text style={typo.wordmark}>JAMLINK</Text>
        </View>
        {overlay ? (
          <TouchableOpacity
            onPress={back}
            accessibilityRole="button"
            accessibilityLabel={`Back to ${tabLabel}`}
            style={styles.backPill}>
            <Text style={[styles.backText, { color: colors.accent }]}>{'‹  '}</Text>
            <Text style={styles.backText}>{tabLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {/* ponytail: no outer ScrollView and no outer padding, each screen owns its
          scroll, its refresh, and its own full-bleed edges */}
      <View style={{ flex: 1 }}>
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
      <View style={styles.dock}>
        <View style={styles.dockPill}>
          {TABS.map((t) => {
            const selected = !overlay && tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => goTab(t.key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${t.label} tab`}
                style={[styles.tabItem, selected && styles.tabItemOn]}>
                <Text style={[styles.tabLabel, selected && styles.tabLabelOn]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

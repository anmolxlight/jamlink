import { registerRootComponent } from 'expo';

import App from './App';

// ponytail: MainActivity.getMainComponentName() is "main"; registerRootComponent is
// the ONLY thing that does AppRegistry.registerComponent('main', ...). Without this
// file the release APK bundles App.tsx as the entry, registers nothing, and dies at
// launch with `Invariant Violation: "main" has not been registered.` (v0.1.2-v0.1.6).
// package.json "main" must point here, never straight at App.tsx.
registerRootComponent(App);

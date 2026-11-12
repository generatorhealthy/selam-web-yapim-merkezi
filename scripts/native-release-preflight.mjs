import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Read-only inspection: never builds, syncs, sends notifications or contacts production.
const checks = [
  ['iOS Xcode project', existsSync('ios/App/App.xcodeproj/project.pbxproj')],
  ['iOS entry point', existsSync('ios/App/App/AppDelegate.swift')],
  ['iOS application manifest', existsSync('ios/App/App/Info.plist')],
  ['Android project', existsSync('android/app/build.gradle')],
  ['Android application manifest', existsSync('android/app/src/main/AndroidManifest.xml')],
  ['Android Gradle wrapper', existsSync('android/gradlew')],
  ['Java', spawnSync('java', ['-version'], { stdio: 'ignore' }).status === 0],
  ['Xcode', spawnSync('xcodebuild', ['-version'], { stdio: 'ignore' }).status === 0],
];
const config = readFileSync('capacitor.config.ts', 'utf8');
checks.push(['Existing app identity preserved', config.includes("appId: 'app.lovable.doktorumol'")]);
checks.push(['Native build uses bundled files, not preview server', config.includes("webDir: 'dist'") && !/server\s*:/.test(config)]);
for (const [name, ok] of checks) console.log(`${ok ? 'OK' : 'MISSING'} ${name}`);
console.log('Store signing, existing version/build numbers and physical-device acceptance need the release owner; no readiness is inferred.');
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
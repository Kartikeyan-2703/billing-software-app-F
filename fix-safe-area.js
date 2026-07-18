const fs = require('fs');

const files = [
  'src/app/admin.tsx',
  'src/app/checkout.tsx',
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/menu.tsx',
  'src/app/(tabs)/orders.tsx',
  'src/app/(tabs)/settings.tsx',
  'src/app/(tabs)/trends.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('SafeAreaView')) {
    content = content.replace(/,\s*SafeAreaView/, '');
    content = content.replace(/SafeAreaView,\s*/, '');
    
    // Add import statement at the top
    const importStr = "import { SafeAreaView } from 'react-native-safe-area-context';\n";
    content = importStr + content;
    
    fs.writeFileSync(f, content);
  }
});

console.log('Done');

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying claude.md installation...\n');

const files = [
  'claude.md',
  'frontend/claude.md',
  'frontend/app/api/claude.md'
];

let allFound = true;

files.forEach(file => {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    const lines = fs.readFileSync(fullPath, 'utf-8').split('\n').length;
    console.log('✅', file);
    console.log('   Size:', stats.size, 'bytes');
    console.log('   Lines:', lines);
  } else {
    console.log('❌', file, '- NOT FOUND');
    allFound = false;
  }
});

if (allFound) {
  console.log('\n✨ All claude.md files successfully installed!');
  console.log('\n📚 Claude now has context about:');
  console.log('  • Pacific Sands Resort business logic');
  console.log('  • Your database schema (PaceReport, OccupancyData, etc.)');
  console.log('  • API endpoints and authentication');
  console.log('  • Project structure and patterns');
} else {
  console.log('\n⚠️  Some files are missing. Please check the installation.');
}

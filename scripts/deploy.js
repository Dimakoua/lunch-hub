import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workersDir = path.join(__dirname, '..', 'workers');
const wranglerTomlPath = path.join(workersDir, 'wrangler.toml');

console.log('🔍 Checking for existing KV namespace...');

try {
  // Get list of KV namespaces
  const listOutput = execSync('npx wrangler kv namespace list', { cwd: workersDir, encoding: 'utf-8' });
  
  const firstBracket = listOutput.indexOf('[');
  const lastBracket = listOutput.lastIndexOf(']');
  let namespaces = [];
  
  if (firstBracket !== -1 && lastBracket !== -1) {
    const jsonStr = listOutput.substring(firstBracket, lastBracket + 1);
    namespaces = JSON.parse(jsonStr);
  }
  
  let pollsNamespace = namespaces.find(ns => ns.title.includes('lunch-hub') && ns.title.includes('POLLS'));
  
  if (!pollsNamespace) {
    console.log('⚙️ KV namespace not found. Creating one automatically...');
    const createOutput = execSync('npx wrangler kv namespace create POLLS', { cwd: workersDir, encoding: 'utf-8' });
    console.log(createOutput);
    
    // Fetch the list again to get the ID
    const newListOutput = execSync('npx wrangler kv namespace list', { cwd: workersDir, encoding: 'utf-8' });
    const newFirstBracket = newListOutput.indexOf('[');
    const newLastBracket = newListOutput.lastIndexOf(']');
    
    if (newFirstBracket !== -1 && newLastBracket !== -1) {
      const newJsonStr = newListOutput.substring(newFirstBracket, newLastBracket + 1);
      const newNamespaces = JSON.parse(newJsonStr);
      pollsNamespace = newNamespaces.find(ns => ns.title.includes('lunch-hub') && ns.title.includes('POLLS'));
    }
    
    if (!pollsNamespace) {
      // Fallback: try to extract ID from create output
      const idMatch = createOutput.match(/id\s*=\s*"([^"]+)"/);
      if (idMatch && idMatch[1]) {
        pollsNamespace = { id: idMatch[1] };
      } else {
        throw new Error('Failed to find KV namespace ID after creation.');
      }
    }
  }

  const kvId = pollsNamespace.id;
  console.log(`✅ Found KV Namespace ID: ${kvId}`);

  // Update wrangler.toml
  let tomlContent = fs.readFileSync(wranglerTomlPath, 'utf-8');
  tomlContent = tomlContent.replace(/(binding\s*=\s*"POLLS"\n\s*id\s*=\s*)"[^"]*"/, `$1"${kvId}"`);
  
  // Fallback if the regex doesn't match exactly (e.g. windows newlines or different spacing)
  if (!tomlContent.includes(`"${kvId}"`)) {
    tomlContent = tomlContent.replace(/LUNCH_HUB_POLLS_ID_PLACEHOLDER/g, kvId);
    // If it STILL doesn't have it, try a more generic replace
    if (!tomlContent.includes(kvId)) {
      tomlContent = tomlContent.replace(/id\s*=\s*"[^"]*"/g, `id = "${kvId}"`);
    }
  }
  
  fs.writeFileSync(wranglerTomlPath, tomlContent);
  console.log('📝 Updated wrangler.toml with the KV ID.');

  console.log('🚀 Deploying to Cloudflare...');
  execSync('npx wrangler deploy', { cwd: workersDir, stdio: 'inherit' });
  console.log('🎉 Deployment complete!');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
}

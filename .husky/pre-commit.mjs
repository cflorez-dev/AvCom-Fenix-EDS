import { exec } from "node:child_process";

const run = (cmd) => new Promise((resolve, reject) => exec(
  cmd,
  (error, stdout) => {
    if (error) reject(error);
    else resolve(stdout);
  }
));

const changeset = await run('git diff --cached --name-only --diff-filter=ACMR');
const modifiedFiles = changeset.split('\n').filter(Boolean);

// check if there are any model files staged
const modifledPartials = modifiedFiles.filter((file) => file.match(/(^|\/)_.*.json/));
if (modifledPartials.length > 0) {
  const output = await run('npm run build:json --silent');
  console.log(output);
  await run('git add component-models.json component-definition.json component-filters.json');
}

// check if there are any files that require Tailwind CSS rebuild
const filesRequiringTailwindRebuild = modifiedFiles.filter((file) => 
  file.match(/^(blocks|design-system)\/.*\.(js|jsx)$/) || // JS files in blocks or design-system
  file.match(/^styles\/variables\/.*\.css$/) || // CSS variable files
  file.match(/^tailwind\.config\.(js|mjs)$/) // Tailwind config
);

if (filesRequiringTailwindRebuild.length > 0) {
  console.log('🎨 Detected changes requiring Tailwind CSS rebuild...');
  const output = await run('npm run tw:build --silent');
  console.log(output);
  console.log('✅ Tailwind CSS compiled successfully');
  await run('git add styles/tw.css');
}

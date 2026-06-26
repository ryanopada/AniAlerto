const fs = require('fs');

let content = fs.readFileSync('receiver.js', 'utf8');

const target = `        }
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session && session.step === 'OTHER_HELP_DESC') {`;

const replacement = `        }
        if (session && session.step === 'OTHER_HELP_DESC') {`;

content = content.replace(target, replacement);

fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Removed duplicate session declaration!");

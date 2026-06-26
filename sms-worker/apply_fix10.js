const fs = require('fs');
let content = fs.readFileSync('receiver.js', 'utf8');

const targetIntercept = `      const helpNum = sms.text.trim();
      if (/^[1-7]$/.test(helpNum)) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session) {`;

const replaceIntercept = `      const helpNum = sms.text.trim();
      if (/^[1-7]$/.test(helpNum)) {
        const session = await getHelpSession(normalizedPhone, workerId);
        if (session && session.step !== 'OTHER_HELP_DESC') {`;

content = content.replace(targetIntercept, replaceIntercept);
fs.writeFileSync('receiver.js', content, 'utf8');
console.log("Fixed ^[1-7]$ intercept for OTHER_HELP_DESC!");

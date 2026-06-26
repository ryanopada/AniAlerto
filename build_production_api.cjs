const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, 'anialerto-backend', 'src');
const prodDir = path.join(__dirname, 'anialerto-backend', 'src_production');

// Create production dir
if (fs.existsSync(prodDir)) {
    fs.rmSync(prodDir, { recursive: true, force: true });
}
fs.mkdirSync(prodDir);

// Copy all files
const files = fs.readdirSync(srcDir);
for (const file of files) {
    if (file.endsWith('.php')) {
        let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
        
        // Fix exact matches for new mysqli("localhost", "root", "", "anialerto")
        content = content.replace(
            /new\s+mysqli\s*\(\s*['"]localhost['"]\s*,\s*['"]root['"]\s*,\s*['"]['"]\s*,\s*['"]anialerto['"]\s*\)/g,
            'new mysqli("localhost", "u268935662_anialerto123", "AniAlerto123", "u268935662_AniAlerto")'
        );
        
        // Fix variables
        content = content.replace(/\$db_name\s*=\s*['"]anialerto['"]/g, '$db_name = "u268935662_AniAlerto"');
        content = content.replace(/\$username\s*=\s*['"]root['"]/g, '$username = "u268935662_anialerto123"');
        content = content.replace(/\$password\s*=\s*['"]['"]/g, '$password = "AniAlerto123"');
        
        // Fix PDO DB name and inject timezone
        content = content.replace(/dbname=anialerto/g, 'dbname=u268935662_AniAlerto');
        content = content.replace(
            /\$this->conn->exec\("set names utf8mb4"\);/g, 
            '$this->conn->exec("set names utf8mb4"); $this->conn->exec("SET time_zone = \'+08:00\'");'
        );

        // Inject timezone for mysqli objects ($conn = new mysqli(...))
        content = content.replace(
            /(\$conn\s*=\s*new\s+mysqli[^;]+;)/g,
            '$1 $conn->query("SET time_zone = \'+08:00\'");'
        );
        
        fs.writeFileSync(path.join(prodDir, file), content);
    }
}

console.log("Replaced credentials in all files!");

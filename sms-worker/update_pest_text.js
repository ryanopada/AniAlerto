require('dotenv').config();
const mysql = require('mysql2/promise');

async function updatePest() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    // Harabas
    const harabasEn = "Harabas reported.\nMga dapat gawin:\n1.1 Suriin ang hindi bababa sa 50 halaman sa apektadong bahagi ng taniman.\n1.2 Hanapin ang mga kumpol ng itlog at mga pinsala sa dahon o whorl ng mais.\n1.3 Kung kakaunti pa lamang ang infestation, magsagawa ng biological control gamit ang Bacillus thuringiensis (Bt) o mga natural na predator kung available.\n1.4 Kung marami nang halaman ang may malalaking butas o malawak na pinsala, magsagawa ng targeted spraying.\n1.5 Isagawa ang pag-spray sa hapon o gabi at ituon ang spray sa loob ng whorl ng halaman.\n1.6 Ipaalam agad sa Farm Head kung mabilis na lumalawak ang infestation.\nI-reply ang DONE kapag natapos.";
    
    const harabasTl = "Harabas ang naiulat.\nMga dapat gawin:\n1.1 Suriin ang hindi bababa sa 50 halaman sa apektadong bahagi ng taniman.\n1.2 Hanapin ang mga kumpol ng itlog at mga pinsala sa dahon o whorl ng mais.\n1.3 Kung kakaunti pa lamang ang infestation, magsagawa ng biological control gamit ang Bacillus thuringiensis (Bt) o mga natural na predator kung available.\n1.4 Kung marami nang halaman ang may malalaking butas o malawak na pinsala, magsagawa ng targeted spraying.\n1.5 Isagawa ang pag-spray sa hapon o gabi at ituon ang spray sa loob ng whorl ng halaman.\n1.6 Ipaalam agad sa Farm Head kung mabilis na lumalawak ang infestation.\nI-reply ang DONE kapag natapos.";

    await conn.execute(
      `UPDATE pest_advisories SET advisory_en = ?, advisory_tl = ? WHERE option_number = 1`,
      [harabasEn, harabasTl]
    );
    
    // Uod sa Tangkay
    const uodEn = "Uod sa Tangkay reported.\nMga dapat gawin:\n2.1 Suriin ang ilalim ng mga dahon para sa mga kumpol ng itlog.\n2.2 Alisin at durugin agad ang mga nakitang egg masses.\n2.3 Maglagay ng biological control agents tulad ng Trichogramma cards kung available.\n2.4 Suriin ang mga tangkay para sa mga senyales ng pagbubutas o tunneling.\n2.5 Markahan ang mga apektadong halaman para sa monitoring.\n2.6 Ipaalam agad sa Farm Head kung dumarami ang mga apektadong halaman.\nI-reply ang DONE kapag natapos.";
    const uodTl = "Uod sa Tangkay ang naiulat.\nMga dapat gawin:\n2.1 Suriin ang ilalim ng mga dahon para sa mga kumpol ng itlog.\n2.2 Alisin at durugin agad ang mga nakitang egg masses.\n2.3 Maglagay ng biological control agents tulad ng Trichogramma cards kung available.\n2.4 Suriin ang mga tangkay para sa mga senyales ng pagbubutas o tunneling.\n2.5 Markahan ang mga apektadong halaman para sa monitoring.\n2.6 Ipaalam agad sa Farm Head kung dumarami ang mga apektadong halaman.\nI-reply ang DONE kapag natapos.";
    
    await conn.execute(
      `UPDATE pest_advisories SET advisory_en = ?, advisory_tl = ? WHERE option_number = 2`,
      [uodEn, uodTl]
    );

    // Langaw-langaw
    const langawEn = "Langaw-langaw reported.\nMga dapat gawin:\n3.1 Suriin ang mga batang halaman para sa sintomas ng deadheart o pagkatuyo ng gitnang dahon.\n3.2 Bilangin at markahan ang mga apektadong punla.\n3.3 Alisin ang mga damo sa paligid ng taniman na maaaring pamugaran ng peste.\n3.4 Obserbahan kung patuloy na tumataas ang bilang ng mga apektadong halaman.\n3.5 Kung malawak na ang pinsala at maraming punla ang may deadheart, agad na iulat sa Farm Head para sa posibleng replanting.\nI-reply ang DONE kapag natapos.";
    const langawTl = "Langaw-langaw ang naiulat.\nMga dapat gawin:\n3.1 Suriin ang mga batang halaman para sa sintomas ng deadheart o pagkatuyo ng gitnang dahon.\n3.2 Bilangin at markahan ang mga apektadong punla.\n3.3 Alisin ang mga damo sa paligid ng taniman na maaaring pamugaran ng peste.\n3.4 Obserbahan kung patuloy na tumataas ang bilang ng mga apektadong halaman.\n3.5 Kung malawak na ang pinsala at maraming punla ang may deadheart, agad na iulat sa Farm Head para sa posibleng replanting.\nI-reply ang DONE kapag natapos.";

    await conn.execute(
      `UPDATE pest_advisories SET advisory_en = ?, advisory_tl = ? WHERE option_number = 3`,
      [langawEn, langawTl]
    );

    // Kuto-kuto
    const kutoEn = "Kuto-kuto reported.\nMga dapat gawin:\n4.1 Suriin ang ilalim ng mga dahon at tassels para sa aphid colonies.\n4.2 Tingnan kung may honeydew o maitim na amag sa mga dahon.\n4.3 Para sa maliit na infestation, magsagawa ng botanical spray tulad ng kakawate extract kung available.\n4.4 Patuloy na obserbahan ang pagdami ng aphids sa mga halaman.\n4.5 Kung laganap na ang infestation sa malaking bahagi ng taniman, agad na iulat sa Farm Head para sa karampatang intervention.\nI-reply ang DONE kapag natapos.";
    const kutoTl = "Kuto-kuto ang naiulat.\nMga dapat gawin:\n4.1 Suriin ang ilalim ng mga dahon at tassels para sa aphid colonies.\n4.2 Tingnan kung may honeydew o maitim na amag sa mga dahon.\n4.3 Para sa maliit na infestation, magsagawa ng botanical spray tulad ng kakawate extract kung available.\n4.4 Patuloy na obserbahan ang pagdami ng aphids sa mga halaman.\n4.5 Kung laganap na ang infestation sa malaking bahagi ng taniman, agad na iulat sa Farm Head para sa karampatang intervention.\nI-reply ang DONE kapag natapos.";

    await conn.execute(
      `UPDATE pest_advisories SET advisory_en = ?, advisory_tl = ? WHERE option_number = 4`,
      [kutoEn, kutoTl]
    );

    console.log("Updated pest text with new numbered format successfully!");

  } catch (err) {
    console.error("Error updating pest flows:", err);
  } finally {
    await conn.end();
  }
}

updatePest();

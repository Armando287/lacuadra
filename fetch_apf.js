const fs = require('fs');
fetch('https://www.apf.org.py/partidos-clausura')
  .then(r => r.text())
  .then(t => {
    fs.writeFileSync('apf_page.html', t);
    console.log('Saved APF page to apf_page.html');
  })
  .catch(e => console.error(e));

fetch('https://www.promiedos.com.ar/').then(r=>r.text()).then(t => { 
  const matches = [...t.matchAll(/(.{0,100}begec.{0,100})/g)];
  console.log(matches.map(m => m[0]));
});

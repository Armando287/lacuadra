fetch('https://api.promiedos.com.ar/league/games/gcb/621_152_4_2').then(r => r.json()).then(data => { console.log(JSON.stringify(data.games[0].stage_round_name, null, 2)); }).catch(console.error);

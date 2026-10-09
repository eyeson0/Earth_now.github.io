/* EARTH // NOW — live data client. Public, no-key endpoints are used deliberately. */
const API = {
  geo: 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&q=',
  weather: 'https://api.open-meteo.com/v1/forecast',
  country: 'https://restcountries.com/v3.1/alpha/',
  wiki: 'https://en.wikipedia.org/api/rest_v1/page/summary/'
};
const quotes = [
  'Time connects every place on Earth.',
  'Every place has a story still being told.',
  'The world changes; the moment is always now.',
  'Follow the light, then learn the landscape.',
  'Distance is a different kind of perspective.',
  'A clock is a map drawn in motion.'
];
const quick = [
  { name: 'Kathmandu', country: 'Nepal', lat: 27.7172, lon: 85.324, zone: 'Asia/Kathmandu', code: 'NP' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, zone: 'Asia/Tokyo', code: 'JP' },
  { name: 'London', country: 'United Kingdom', lat: 51.5072, lon: -0.1276, zone: 'Europe/London', code: 'GB' },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.006, zone: 'America/New_York', code: 'US' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, zone: 'Africa/Cairo', code: 'EG' }
];
/* Verified essentials used when an external country service is unavailable. Sources: UN data / CIA World Factbook / national reference pages. */
const countryFallback = {
  NP:{name:'Nepal',region:'South Asia · Asia',capital:'Kathmandu',population:'30,666,598',area:'147,516 km²',currency:'Nepalese rupee',languages:'Nepali and regional languages',timezones:'UTC+05:45',summary:'Nepal is a landlocked Himalayan country between India and China. Its history includes long-established valley civilizations, many regional kingdoms, eighteenth-century unification, constitutional change, and a federal democratic republic since 2008.',timeline:[['ANCIENT','The Kathmandu Valley developed as a durable cultural and trading centre.'],['1768–69','Prithvi Narayan Shah’s campaigns united many hill states.'],['1951','The Rana oligarchy ended after a democratic movement.'],['2008','Nepal became a Federal Democratic Republic.'],['2015','A new constitution established its federal framework.']]},
  JP:{name:'Japan',region:'Eastern Asia · Asia',capital:'Tokyo',population:'123,975,371',area:'377,930 km²',currency:'Japanese yen',languages:'Japanese',timezones:'UTC+09:00',summary:'Japan is an island country in East Asia with a long continuum of distinctive cultures and political institutions. The Meiji Restoration began major modernization in 1868; postwar Japan developed under its 1947 constitution.',timeline:[['ANCIENT','Early cultures developed across the Japanese archipelago.'],['1868','The Meiji Restoration began political and economic modernization.'],['1947','Japan’s postwar constitution came into force.'],['TODAY','Japan is a constitutional monarchy and a major global economy.']]},
  GB:{name:'United Kingdom',region:'Northern Europe · Europe',capital:'London',population:'68,350,000',area:'243,610 km²',currency:'Pound sterling',languages:'English and regional languages',timezones:'Europe/London',summary:'The United Kingdom is a constitutional monarchy of England, Scotland, Wales and Northern Ireland. Its institutions emerged through unions of the historic nations and evolved through parliamentary reform and global change.',timeline:[['1707','The Acts of Union joined England and Scotland.'],['1801','Great Britain and Ireland formed the United Kingdom.'],['1922','Most of Ireland left the United Kingdom.'],['TODAY','The UK is a parliamentary democracy and constitutional monarchy.']]},
  US:{name:'United States',region:'Northern America · Americas',capital:'Washington, D.C.',population:'340,110,988',area:'9,833,517 km²',currency:'United States dollar',languages:'English is most widely used',timezones:'Multiple IANA zones',summary:'The United States is a federal republic in North America. It declared independence in 1776 and expanded across the continent, with its modern political and social history shaped by constitutional government, migration, civil conflict, industrialization and global engagement.',timeline:[['1776','The Declaration of Independence was adopted.'],['1788','The Constitution was ratified.'],['1861–65','Civil War and emancipation reshaped the nation.'],['TODAY','The US is a federal presidential republic.']]},
  AU:{name:'Australia',region:'Australia and New Zealand · Oceania',capital:'Canberra',population:'27,000,000',area:'7,692,024 km²',currency:'Australian dollar',languages:'English and Indigenous languages',timezones:'Multiple IANA zones',summary:'Australia is a continent-country with the world’s oldest continuing cultures. British colonization began in the late eighteenth century, and its six colonies federated as the Commonwealth of Australia in 1901.',timeline:[['ANCIENT','Aboriginal and Torres Strait Islander peoples have continuous connections to Country.'],['1788','British colonization began at Sydney Cove.'],['1901','The six colonies federated.'],['TODAY','Australia is a parliamentary democracy and constitutional monarchy.']]},
  EG:{name:'Egypt',region:'Northern Africa · Africa',capital:'Cairo',population:'112,700,000',area:'1,001,450 km²',currency:'Egyptian pound',languages:'Arabic',timezones:'Africa/Cairo',summary:'Egypt is a northeastern African country centered on the Nile Valley. It was home to one of the world’s earliest civilizations and has remained a cultural, political and trading crossroads through successive ancient, medieval and modern eras.',timeline:[['ANCIENT','Ancient Egyptian civilization developed along the Nile.'],['332 BCE','Egypt entered a Hellenistic period.'],['1952','A revolution ended the monarchy.'],['TODAY','Egypt is a republic with Cairo as its capital.']]}
};
const planets = {
  Sun:['Star','1.39 million km','~25–35 Earth days','—','8 planets','The Solar System’s star and its dominant source of light and energy.','https://science.nasa.gov/sun/'],
  Mercury:['Terrestrial planet','4,880 km','58.6 Earth days','88 Earth days','0','The closest planet to the Sun, with extreme surface temperature variation.','https://science.nasa.gov/mercury/'],
  Venus:['Terrestrial planet','12,104 km','243 Earth days','225 Earth days','0','A cloud-covered world with a dense carbon-dioxide atmosphere and extreme greenhouse heating.','https://science.nasa.gov/venus/'],
  Earth:['Terrestrial planet','12,756 km','23.9 hours','365.25 days','1','Our ocean-rich home world, the only known planet with life.','https://science.nasa.gov/earth/'],
  Moon:['Natural satellite','3,475 km','27.3 Earth days','27.3 Earth days','—','Earth’s only natural satellite, whose changing phase is a result of Sun-Earth-Moon geometry.','https://science.nasa.gov/moon/'],
  Mars:['Terrestrial planet','6,792 km','24.6 hours','687 Earth days','2','The red planet is a cold desert world with evidence of ancient water environments.','https://science.nasa.gov/mars/'],
  Jupiter:['Gas giant','142,984 km','9.9 hours','11.86 years','95 known','The largest planet, with a turbulent atmosphere and a vast magnetic environment.','https://science.nasa.gov/jupiter/'],
  Saturn:['Gas giant','120,536 km','10.7 hours','29.45 years','146 known','A gas giant distinguished by its brilliant ring system of ice and rock.','https://science.nasa.gov/saturn/'],
  Uranus:['Ice giant','51,118 km','17.2 hours','84 years','27 known','An ice giant that rotates nearly on its side.','https://science.nasa.gov/uranus/'],
  Neptune:['Ice giant','49,528 km','16.1 hours','164.8 years','14 known','The most distant major planet, with fast winds in its deep blue atmosphere.','https://science.nasa.gov/neptune/'],
  Pluto:['Dwarf planet','2,377 km','6.4 Earth days','248 years','5 known','A dwarf planet in the Kuiper Belt, visited by NASA’s New Horizons spacecraft.','https://science.nasa.gov/dwarf-planets/pluto/'],
  Ceres:['Dwarf planet','940 km','9.1 hours','4.6 years','0','The largest object in the asteroid belt and the only dwarf planet in the inner Solar System.','https://science.nasa.gov/dwarf-planets/ceres/'],
  Haumea:['Dwarf planet','~1,632 km (long axis)','3.9 hours','284 years','2 known','A rapidly rotating, elongated dwarf planet in the Kuiper Belt.','https://science.nasa.gov/dwarf-planets/haumea/'],
  Makemake:['Dwarf planet','~1,430 km','~22.5 hours','305 years','1 known','A reddish, icy dwarf planet in the Kuiper Belt.','https://science.nasa.gov/dwarf-planets/makemake/'],
  Eris:['Dwarf planet','~2,326 km','~25.9 hours','558 years','1 known','A distant icy dwarf planet whose discovery helped refine Solar System classification.','https://science.nasa.gov/dwarf-planets/eris/']
};
const visualRotation = {Sun:['25–35 Earth days','7s'],Mercury:['58.6 Earth days','12s'],Venus:['243 Earth days · retrograde','14s'],Earth:['23.9 hours','8s'],Moon:['27.3 Earth days','13s'],Mars:['24.6 hours','9s'],Jupiter:['9.9 hours','5s'],Saturn:['10.7 hours','6s'],Uranus:['17.2 hours · retrograde','10s'],Neptune:['16.1 hours','8s'],Pluto:['6.4 Earth days','11s'],Ceres:['9.1 hours','10s'],Haumea:['3.9 hours','5s'],Makemake:['22.5 hours','10s'],Eris:['25.9 hours','10s']};
const weatherCodes = { 0:['CLEAR','☀'],1:['MAINLY CLEAR','◐'],2:['PARTLY CLOUDY','◒'],3:['OVERCAST','☁'],45:['FOG','≋'],48:['RIME FOG','≋'],51:['DRIZZLE','⌇'],53:['DRIZZLE','⌇'],55:['DRIZZLE','⌇'],61:['RAIN','☂'],63:['RAIN','☂'],65:['HEAVY RAIN','☂'],71:['SNOW','❄'],73:['SNOW','❄'],75:['HEAVY SNOW','❄'],80:['SHOWERS','☂'],81:['SHOWERS','☂'],82:['HEAVY SHOWERS','☂'],95:['THUNDERSTORM','ϟ'],96:['THUNDERSTORM','ϟ'],99:['THUNDERSTORM','ϟ'] };
const state = window.EarthNowCore.state;
state.quoteIndex ||= 0;
const $ = (s) => document.querySelector(s);
const el = {
  loader: $('#loader'), loaderText: $('#loaderText'), place: $('#placeName'), country: $('#countryName'), clock: $('#clock'), meta: $('#timeMeta'), date: $('#dateLine'), temp: $('#temperature'), condition: $('#condition'), weatherIcon: $('.weather-icon'), lat: $('#latValue'), lon: $('#lonValue'), utc: $('#utcValue'), quote: $('#quote'), marker: $('#mapMarker'), markerLabel: $('#markerLabel'), coords: $('#mapCoords'), results: $('#searchResults'), grid: $('#clockGrid'), countryLoading: $('#countryLoading'), countryContent: $('#countryContent'), toast: $('#toast')
};
function pad(n){ return String(n).padStart(2,'0'); }
function locationZone(loc){ return loc.zone || Intl.DateTimeFormat().resolvedOptions().timeZone; }
function zonedParts(zone){
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',weekday:'long',day:'2-digit',month:'long',year:'numeric',timeZoneName:'shortOffset'}).formatToParts(new Date());
  const item = (type) => parts.find(p=>p.type===type)?.value || '';
  return { h:item('hour'), m:item('minute'), s:item('second'), weekday:item('weekday'), day:item('day'), month:item('month'), year:item('year'), zone:item('timeZoneName').replace('GMT','UTC') };
}
function tick(){
  if(!state.location) return;
  const p = zonedParts(locationZone(state.location));
  let time = `${p.h}:${p.m}${state.seconds ? `:${p.s}`:''}`;
  if(state.format === '12'){
    const hour = Number(p.h); time = `${pad((hour%12)||12)}:${p.m}${state.seconds ? `:${p.s}`:''} ${hour >= 12?'PM':'AM'}`;
  }
  if(el.clock.textContent !== time){ el.clock.textContent = time; el.clock.classList.remove('tick'); void el.clock.offsetWidth; el.clock.classList.add('tick'); }
  el.meta.textContent = state.zone ? p.zone : '';
  el.date.textContent = `${p.weekday.toUpperCase()}  //  ${p.day} ${p.month.toUpperCase()} ${p.year}`;
  el.meta.style.display = state.zone?'block':'none'; el.date.style.display = state.date?'block':'none';
  renderWorldClocks();
}
function isDay(weather){
  return weather?.is_day === 1;
}
function setTheme(){ document.body.classList.toggle('theme-night', !isDay(state.weather)); document.body.classList.toggle('daylight', isDay(state.weather)); }
function setLocation(loc, fromSearch=false){
  window.EarthNowCore.set({ location: loc });
  document.documentElement.style.setProperty('--map-x', `${((loc.lon+180)/360)*100}%`);
  document.documentElement.style.setProperty('--map-y', `${(1-(loc.lat+90)/180)*100}%`);
  el.place.textContent = loc.name.toUpperCase(); el.country.textContent = loc.country?.toUpperCase() || '';
  el.lat.textContent = `${Math.abs(loc.lat).toFixed(3)}° ${loc.lat >= 0?'N':'S'}`; el.lon.textContent = `${Math.abs(loc.lon).toFixed(3)}° ${loc.lon >= 0?'E':'W'}`;
  el.marker.style.left = `${Math.min(92,Math.max(8,((loc.lon+180)/360)*100))}%`; el.marker.style.top = `${Math.min(88,Math.max(10,(1-(loc.lat+90)/180)*100))}%`;
  el.markerLabel.textContent = loc.name.toUpperCase(); el.coords.textContent = `${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}°`;
  tick(); getWeather(loc); getCountry(loc); addRecent(loc); if(fromSearch){startEarthJourney(loc);showToast(`${loc.name.toUpperCase()} SELECTED`);}
}
function startEarthJourney(loc){
  const j=$('#journey'),world=$('#journeyWorld'),marker=$('#journeyMarker'); if(!j||!world)return;
  const x=50+(loc.lon/180)*28, y=50-(loc.lat/90)*28; world.style.setProperty('--journey-y',`${-loc.lon*.42}deg`);world.style.setProperty('--journey-x',`${loc.lat*.18}deg`);marker.style.setProperty('--marker-x',`${x}%`);marker.style.setProperty('--marker-y',`${y}%`);
  j.className='journey earth rotating';$('#journeyLabel').textContent=loc.name.toUpperCase();$('#journeyMeta').textContent=`${(loc.country||'EARTH').toUpperCase()} · ${loc.lat.toFixed(2)}°, ${loc.lon.toFixed(2)}° · LIVE EARTH FOCUS`;
  window.EarthNowCore.transition('earth-focus', { duration:1350, onStart:()=>j.classList.add('active'), onComplete:()=>j.classList.remove('active'), onCancel:()=>j.classList.remove('active') });
}
function startPlanetJourney(name){
  const key=name.toLowerCase().replace(/\s+/g,'');const j=$('#journey');if(!j)return;const motion=visualRotation[name]||['—','9s'];j.className=`journey ${key} rotating${name==='Venus'||name==='Uranus'?' retrograde':''}`;j.style.setProperty('--rotation-speed',motion[1]);$('#journeyLabel').textContent=name.toUpperCase();$('#journeyMeta').textContent=`ROTATION PERIOD ${motion[0].toUpperCase()} · VISUALIZATION SPEED ${motion[1].toUpperCase()} · ACCELERATED`;
  window.EarthNowCore.set({ world:name }); window.EarthNowCore.transition('planet-focus', { duration:1400, onStart:()=>j.classList.add('active'), onComplete:()=>j.classList.remove('active'), onCancel:()=>j.classList.remove('active') });
}
async function getWeather(loc){
  clearTimeout(state.weatherTimer); state.weather = null; renderWeather();
  const request = window.EarthNowCore.beginRequest('weather');
  try {
    const params = new URLSearchParams({latitude:loc.lat,longitude:loc.lon,current:'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,is_day',daily:'sunrise,sunset,uv_index_max',timezone:'auto',forecast_days:'1'});
    const data = await fetch(`${API.weather}?${params}`, { signal: request.signal }).then(assertOk).then(r=>r.json());
    if (!request.isCurrent() || state.location !== loc) return;
    window.EarthNowCore.set({weather:{...data.current, daily:data.daily, timezone:data.timezone}});
    if(data.timezone){ loc.zone=data.timezone; window.EarthNowCore.set({location:loc}); }
    renderWeather(); setTheme(); tick();
  } catch(err) { if(err.name !== 'AbortError') { console.warn(err); el.condition.textContent='LIVE DATA UNAVAILABLE'; } }
  state.weatherTimer = setTimeout(()=>getWeather(state.location), 15*60*1000);
}
function assertOk(r){ if(!r.ok) throw new Error(`Request failed: ${r.status}`); return r; }
function renderWeather(){
  const w=state.weather; if(!w){el.temp.textContent='—';el.condition.textContent='LOADING LIVE WEATHER';return;}
  const [label,icon] = weatherCodes[w.weather_code] || ['CONDITIONS','◌'];
  el.temp.textContent=`${Math.round(w.temperature_2m)}°C`; el.condition.textContent=label; el.weatherIcon.textContent=icon;
  $('#weatherBigTemp').textContent=`${Math.round(w.temperature_2m)}°C`; $('#weatherBigIcon').textContent=icon; $('#weatherDescription').textContent=label;
  const day = w.daily || {}; const sunrise=day.sunrise?.[0] ? new Intl.DateTimeFormat('en-GB',{timeZone:state.location.zone,hour:'2-digit',minute:'2-digit'}).format(new Date(day.sunrise[0])) : '—'; const sunset=day.sunset?.[0] ? new Intl.DateTimeFormat('en-GB',{timeZone:state.location.zone,hour:'2-digit',minute:'2-digit'}).format(new Date(day.sunset[0])) : '—';
  const vals=[['FEELS LIKE',`${Math.round(w.apparent_temperature)}°C`],['HUMIDITY',`${w.relative_humidity_2m}%`],['WIND',`${Math.round(w.wind_speed_10m)} km/h ${windDirection(w.wind_direction_10m)}`],['PRESSURE',`${Math.round(w.pressure_msl)} hPa`],['CLOUD COVER',`${w.cloud_cover}%`],['UV INDEX',day.uv_index_max?.[0]?.toFixed(1) || '—'],['SUNRISE',sunrise],['SUNSET',sunset]];
  $('#weatherDetails').innerHTML=vals.map(([a,b])=>`<div class="weather-detail"><span>${a}</span>${b}</div>`).join('');
  $('#weatherNote').textContent=`OPEN-METEO · UPDATED ${new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
  renderAstronomy(sunrise,sunset);
}
function renderAstronomy(sunrise,sunset){
  const now=Date.now(), cycle=29.53058867, epoch=Date.UTC(2000,0,6,18,14), age=(((now-epoch)/86400000)%cycle+cycle)%cycle, illumination=Math.round((1-Math.cos(age/cycle*Math.PI*2))*50);
  const phase=age<1.85?'NEW MOON':age<5.54?'WAXING CRESCENT':age<9.23?'FIRST QUARTER':age<12.92?'WAXING GIBBOUS':age<16.61?'FULL MOON':age<20.3?'WANING GIBBOUS':age<23.99?'LAST QUARTER':'WANING CRESCENT';
  const p=zonedParts(state.location.zone); const clockMinutes=Number(p.h)*60+Number(p.m); const [srH,srM]=sunrise==='—'?[6,0]:sunrise.split(':').map(Number); const [ssH,ssM]=sunset==='—'?[18,0]:sunset.split(':').map(Number); const sr=srH*60+srM, ss=ssH*60+ssM;
  let sky=clockMinutes<sr-35?'NIGHT':clockMinutes<sr+30?'DAWN':clockMinutes<ss-55?'DAY':clockMinutes<ss+25?'SUNSET':clockMinutes<ss+80?'TWILIGHT':'NIGHT';
  const untilFull=(14.76529434-age+cycle)%cycle, untilNew=(cycle-age)%cycle;
  window.EarthNowCore.set({ astronomy:{sunrise,sunset,sky}, moon:{phase,illumination,age:+age.toFixed(1),nextFullDays:+untilFull.toFixed(1),nextNewDays:+untilNew.toFixed(1),location:state.location?.name} });
  $('#sunriseHome').textContent=sunrise; $('#sunsetHome').textContent=sunset; $('#skyState').textContent=`SKY ${sky}`; $('#moonHome').textContent=`${phase} · ${illumination}%`;
  document.body.classList.toggle('daylight',sky==='DAY');
}
function windDirection(deg){ const dirs=['N','NE','E','SE','S','SW','W','NW']; return dirs[Math.round((deg||0)/45)%8]; }
async function search(){
  const q=$('#searchInput').value.trim(); if(q.length<2) return;
  const request = window.EarthNowCore.beginRequest('search');
  el.results.innerHTML='<div class="result"><span>SEARCHING THE ATLAS…</span></div>';
  try { const data=await fetch(API.geo+encodeURIComponent(q),{headers:{Accept:'application/json'},signal:request.signal}).then(assertOk).then(r=>r.json()); if(request.isCurrent()) renderResults(data); }
  catch(e){if(e.name!=='AbortError' && request.isCurrent())el.results.innerHTML='<div class="result"><span>LOCATION SEARCH IS TEMPORARILY UNAVAILABLE.</span></div>';}
}
function renderResults(data){
  if(!data.length){el.results.innerHTML='<div class="result"><span>NO MATCHES FOUND. TRY A CITY OR COUNTRY.</span></div>';return;}
  el.results.innerHTML=data.map((d,i)=>{ const a=d.address||{}; const name=a.city||a.town||a.village||a.municipality||a.country||d.display_name.split(',')[0]; const country=a.country||''; return `<button class="result" data-search-index="${i}"><span>${name.toUpperCase()}<small>${country.toUpperCase()}</small></span><small>${Number(d.lat).toFixed(2)}°, ${Number(d.lon).toFixed(2)}° ↗</small></button>`;}).join('');
  [...el.results.querySelectorAll('[data-search-index]')].forEach(btn=>btn.addEventListener('click',()=>{const d=data[btn.dataset.searchIndex],a=d.address||{}; const loc={name:a.city||a.town||a.village||a.municipality||a.country||d.display_name.split(',')[0],country:a.country||'',lat:+d.lat,lon:+d.lon,code:a['ISO3166-1:alpha2']?.toUpperCase()}; setLocation(loc,true); el.results.innerHTML=''; $('#searchInput').value=''; setTimeout(()=>showView('history'),820); }));
}
async function getCountry(loc){
  const code=loc.code; if(!code){el.countryLoading.textContent='Country data will appear when a country code is available.';return;}
  const request=window.EarthNowCore.beginRequest('country');
  el.countryLoading.hidden=false; el.countryContent.hidden=true; el.countryLoading.textContent='OPENING COUNTRY FILE…'; document.body.classList.add('country-content-loading');
  try{
    const c=await fetch(API.country+code,{signal:request.signal}).then(assertOk).then(r=>r.json()).then(d=>d[0]);
    if(!request.isCurrent()||state.location!==loc)return;
    const countryName=c.name.common; const summary=await fetch(API.wiki+encodeURIComponent(countryName),{signal:request.signal}).then(assertOk).then(r=>r.json()).catch(()=>null);
    if(!request.isCurrent()||state.location!==loc)return;
    renderCountry(c,summary, false); el.countryLoading.hidden=true; el.countryContent.hidden=false; document.body.classList.remove('country-content-loading');
  }catch(e){
    if(e.name==='AbortError')return;
    const local=countryFallback[code];
    if(local&&request.isCurrent()&&state.location===loc){renderLocalCountry(local);el.countryLoading.hidden=true;el.countryContent.hidden=false;document.body.classList.remove('country-content-loading');}
    else if(request.isCurrent()) {el.countryLoading.textContent='This country file has only partial local data right now.';document.body.classList.remove('country-content-loading');}
  }
}
function renderCountry(c,summary){
  $('#countryRegion').textContent=[c.subregion,c.region].filter(Boolean).join(' · ').toUpperCase(); $('#countryTitle').textContent=c.name.common.toUpperCase();
  const native=Object.values(c.name.nativeName||{})[0]?.common; const facts=[['CAPITAL',(c.capital||['—']).join(', ')],['POPULATION',new Intl.NumberFormat().format(c.population||0)],['AREA',c.area?`${new Intl.NumberFormat().format(c.area)} KM²`:'—'],['CURRENCY',Object.values(c.currencies||{}).map(v=>v.name).join(', ')||'—'],['LANGUAGES',Object.values(c.languages||{}).join(', ')||'—'],['TIME ZONES',(c.timezones||[]).join(', ')]];
  $('#countryFacts').innerHTML=facts.map(f=>`<div class="fact"><span>${f[0]}</span>${f[1]}</div>`).join('');
  $('#countrySummary').textContent=summary?.extract || `${c.name.common} is located in ${c.region || 'the world'}${c.subregion ? `, in ${c.subregion}` : ''}. Explore authoritative sources for its history, geography, and culture.`;
  const wiki=$('#wikiLink'); wiki.removeAttribute('href'); wiki.textContent='SOURCE: REST COUNTRIES · HISTORICAL REFERENCE DATA';
  const moments=buildTimeline(c.name.common,summary?.extract); $('#timeline').innerHTML=moments.map(x=>`<div class="timeline-item"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('');
}
function renderLocalCountry(c){
  $('#countryRegion').textContent=`${c.region} · LOCAL REFERENCE DATA`; $('#countryTitle').textContent=c.name.toUpperCase();
  const facts=[['CAPITAL',c.capital],['POPULATION',c.population],['AREA',c.area],['CURRENCY',c.currency],['LANGUAGES',c.languages],['TIME ZONES',c.timezones]];
  $('#countryFacts').innerHTML=facts.map(f=>`<div class="fact"><span>${f[0]}</span>${f[1]}</div>`).join(''); $('#countrySummary').textContent=c.summary;
  const wiki=$('#wikiLink');wiki.removeAttribute('href');wiki.textContent='SOURCE: LOCAL HISTORICAL REFERENCE DATA';$('#timeline').innerHTML=c.timeline.map(x=>`<div class="timeline-item"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('');
}
function buildTimeline(name, extract=''){
  const specific={Nepal:[['ANCIENT','The Kathmandu Valley has long been a cultural and trading crossroads in the Himalayan region.'],['1768–69','Prithvi Narayan Shah’s campaigns unified many hill states into modern Nepal.'],['1951','The Rana oligarchy ended after a democratic movement and political change.'],['2008','Nepal became a Federal Democratic Republic.'],['2015','A new constitution established Nepal as a federal democratic republic.']],Japan:[['ANCIENT','The archipelago’s early cultures developed distinctive political and artistic traditions.'],['1868','The Meiji Restoration began a sweeping programme of political and economic modernization.'],['1947','Japan’s postwar constitution came into force.'],['CONTEMPORARY','Japan remains a constitutional monarchy and major global economy.']]};
  return specific[name] || [['GEOGRAPHY',`${name} is part of the global network of places shaped by people, environment, and exchange.`],['HISTORY',extract ? extract.slice(0,170)+'…' : 'Explore the linked sources for a detailed, cited historical account.'],['TODAY',`The country file above uses current metadata from REST Countries and a concise reference summary.`]];
}
function addRecent(loc){ if(!state.clocks.some(x=>Math.abs(x.lat-loc.lat)<.001&&Math.abs(x.lon-loc.lon)<.001)) state.clocks.unshift({...loc}); state.clocks=state.clocks.slice(0,8); window.EarthNowCore.persist(); renderWorldClocks(); renderQuick(); }
function renderWorldClocks(){
  if(!state.clocks.length){el.grid.innerHTML='<p class="source-state">Add locations from Explore to create a synchronized world clock wall.</p>';return;}
  el.grid.innerHTML=state.clocks.map((loc,i)=>{let p=zonedParts(locationZone(loc));let time=state.format==='12'?`${pad((Number(p.h)%12)||12)}:${p.m}${state.seconds?`:${p.s}`:''} ${Number(p.h)>=12?'PM':'AM'}`:`${p.h}:${p.m}${state.seconds?`:${p.s}`:''}`;return `<article class="world-card"><button data-remove="${i}" aria-label="Remove ${loc.name}">×</button><p>${(loc.country||'').toUpperCase()}</p><h2>${time}</h2><strong>${loc.name.toUpperCase()} · ${p.zone}</strong></article>`;}).join('');
  [...el.grid.querySelectorAll('[data-remove]')].forEach(b=>b.addEventListener('click',()=>{state.clocks.splice(+b.dataset.remove,1);renderWorldClocks();}));
}
function renderQuick(){ const container=$('#quickLocations'); container.innerHTML=''; const locs=[...new Map([...state.clocks,...quick].map(x=>[x.name,x])).values()].slice(0,7); locs.forEach(loc=>{const b=document.createElement('button');b.className='quick';b.textContent=loc.name.toUpperCase();b.onclick=()=>{setLocation({...loc},true);showView('home')};container.append(b);}); }
function showView(name){
  const views={home:'homeView',explore:'exploreView',world:'worldView',space:'spaceView',history:'historyView'};
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(x=>x.classList.toggle('active',x.dataset.view===name)); $(`#${views[name]}`).classList.add('active');
  $('#locationDialog').close?.(); if(name==='history') getCountry(state.location); window.scrollTo({top:0,behavior:'smooth'});
}
function openPlanet(name){
  const p=planets[name]; if(!p)return; $('#planetTitle').textContent=name.toUpperCase(); $('#planetKicker').textContent=`NASA PLANETARY FACT SHEET · ${p[0].toUpperCase()}`;
  $('#planetFacts').innerHTML=`<p class="planet-summary">${p[5]}</p><div class="planet-facts">${[['TYPE',p[0]],['DIAMETER',p[1]],['DAY LENGTH',p[2]],['YEAR LENGTH',p[3]],['MOONS',p[4]]].map(x=>`<div class="planet-fact"><span>${x[0]}</span>${x[1]}</div>`).join('')}</div>`;
  $('#nasaLink').href=p[6]; $('#planetPanel').classList.add('open'); setBg(name.toLowerCase(),false); startPlanetJourney(name);
}
function renderPlanets(){
  $('#planetList').innerHTML=Object.keys(planets).map(p=>`<button data-planet="${p}">${p.toUpperCase()}</button>`).join(''); document.querySelectorAll('[data-planet]').forEach(b=>b.onclick=()=>openPlanet(b.dataset.planet));
}
function showToast(text){el.toast.textContent=text;el.toast.classList.add('show');clearTimeout(el.toast.timer);el.toast.timer=setTimeout(()=>el.toast.classList.remove('show'),2200);}
function rotateQuote(){if(!state.quote)return;el.quote.classList.remove('show');setTimeout(()=>{el.quote.textContent=`“${quotes[state.quoteIndex++%quotes.length]}”`;el.quote.classList.add('show');},300);}
function setBg(value, animate=true){
  document.body.classList.add('background-changing');
  const backgrounds=['sun','mercury','venus','earth','moon','mars','jupiter','saturn','uranus','neptune','pluto','ceres','haumea','makemake','eris','space','light']; if(!backgrounds.includes(value))value='earth';
  const apply=()=>{backgrounds.forEach(x=>document.body.classList.remove(`bg-${x}`));if(value!=='earth'&&value!=='light')document.body.classList.add(`bg-${value}`);document.body.classList.toggle('theme-light',value==='light');window.EarthNowCore.set({background:value});document.querySelectorAll('[data-bg]').forEach(b=>b.classList.toggle('selected',b.dataset.bg===value));};
  if(!animate){apply();document.body.classList.remove('background-changing');return;}
  window.EarthNowCore.transition('background-change',{duration:state.reducedMotion?1:850,onStart:apply,onComplete:()=>document.body.classList.remove('background-changing'),onCancel:()=>document.body.classList.remove('background-changing')});
}
window.EarthNowCore.onFrame=(now,current)=>{
  const j=$('#journey'),world=$('#journeyWorld');
  if(j?.classList.contains('active') && world && !current.reducedMotion){
    const name=current.world||'Earth', speed=Number.parseFloat(visualRotation[name]?.[1])||9, direction=(name==='Venus'||name==='Uranus')?-1:1;
    const spin=(now/1000)*(360/speed)*direction; world.style.setProperty('--scene-y',`calc(var(--journey-y, -25deg) + ${spin}deg)`);
    if(name==='Moon')world.style.setProperty('--moon-light',String(Math.max(.08,(current.moon?.illumination||50)/100)));
    if(name==='Earth'&&current.location){const p=zonedParts(locationZone(current.location));world.style.setProperty('--light-angle',`${Number(p.h)*15+Number(p.m)/4}deg`);}
  }
  const panel=$('#debugPanel'); if(panel && !panel.hidden) $('#debugContent').textContent=JSON.stringify(window.EarthNowCore.debug(),null,2);
};
window.EarthNowCore.onSecond=()=>tick();
function bind(){
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  $('[data-action="home"]').addEventListener('click',()=>showView('home')); $('#locationTrigger').onclick=()=>{$('#dialogLocation').textContent=`${state.location.name.toUpperCase()} // ${(state.location.country||'').toUpperCase()}`;$('#locationDialog').showModal();};
  $('#searchBtn').onclick=search; $('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
  $('#settingsBtn').onclick=()=>$('#settings').classList.add('open'); $('#fullscreenBtn').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{const x=$(`#${b.dataset.close}`);x.close?.();x.classList.remove('open');}); $('#weatherOpenBtn').onclick=()=>{$('#locationDialog').close();$('#weatherPanel').classList.add('open');};
  document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{window.EarthNowCore.set({format:b.dataset.format});document.querySelectorAll('[data-format]').forEach(x=>x.classList.toggle('selected',x===b));tick();});
  $('#secondsToggle').onchange=e=>{window.EarthNowCore.set({seconds:e.target.checked});tick()};$('#dateToggle').onchange=e=>{window.EarthNowCore.set({date:e.target.checked});tick()};$('#zoneToggle').onchange=e=>{window.EarthNowCore.set({zone:e.target.checked});tick()};
  $('#scaleRange').oninput=e=>{document.documentElement.style.setProperty('--clock-scale',e.target.value/100);$('#scaleOutput').textContent=`${e.target.value}%`;window.EarthNowCore.set({clockScale:+e.target.value});};
  $('#styleSelect').onchange=e=>{document.body.classList.remove('style-future','style-editorial','style-minimal');document.body.classList.add(`style-${e.target.value}`)};
  $('#fontSelect').onchange=e=>{document.documentElement.style.setProperty('--app-font',`"${e.target.value}", "DM Sans", sans-serif`);document.body.style.fontFamily=`"${e.target.value}", "DM Sans", sans-serif`;window.EarthNowCore.set({font:e.target.value});showToast(`${e.target.value.toUpperCase()} APPLIED`)};
  $('#trackingRange').oninput=e=>{document.documentElement.style.setProperty('--tracking',`${e.target.value/100}em`);$('#trackingOutput').textContent=e.target.value;document.querySelector('.clock').style.letterSpacing=`${e.target.value/100}em`;};
  $('#ambientToggle').onchange=e=>document.body.classList.toggle('ambient',e.target.checked); $('#motionToggle').onchange=e=>window.EarthNowCore.animation.setReducedMotion(e.target.checked);
  document.querySelectorAll('[data-bg]').forEach(b=>b.onclick=()=>setBg(b.dataset.bg));
  $('#bgUpload').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{document.querySelector('.atmosphere').style.backgroundImage=`linear-gradient(rgba(4,12,10,.52),rgba(4,12,10,.76)),url(${r.result})`;document.querySelector('.atmosphere').style.backgroundSize='cover';document.querySelector('.atmosphere').style.backgroundPosition='center';showToast('BACKGROUND APPLIED')};r.readAsDataURL(f);}; $('#resetBg').onclick=()=>{document.querySelector('.atmosphere').style.backgroundImage='';setBg('earth')};
  $('#quoteToggle').onchange=e=>{window.EarthNowCore.set({quote:e.target.checked});el.quote.classList.toggle('show',e.target.checked)};$('#quoteFrequency').onchange=e=>{window.EarthNowCore.set({quoteMs:+e.target.value});clearInterval(state.quoteTimer);state.quoteTimer=setInterval(rotateQuote,state.quoteMs)};
  $('#addCurrentBtn').onclick=()=>{addRecent(state.location);showToast('CURRENT LOCATION ADDED')}; $('#resetAll').onclick=resetSettings;
  $('#debugToggle').onclick=()=>{const p=$('#debugPanel');p.hidden=!p.hidden;};$('#debugClose').onclick=()=>{$('#debugPanel').hidden=true;};
  document.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(e.key==='Escape'){document.querySelectorAll('.settings,.weather-panel').forEach(x=>x.classList.remove('open'));$('#locationDialog').close?.();}if(e.key.toLowerCase()==='s')$('#settings').classList.add('open');if(e.key.toLowerCase()==='f')$('#fullscreenBtn').click();if(e.key==='1')document.querySelector('[data-format="12"]').click();if(e.key==='2')document.querySelector('[data-format="24"]').click();if(e.key.toLowerCase()==='e'||e.key.toLowerCase()==='m')showView('explore');});
}
function resetSettings(){
  localStorage.removeItem('earth-now-settings-v2');
  window.EarthNowCore.set({format:'24',seconds:true,date:true,zone:true,background:'earth',font:'DM Sans',clockScale:100,reducedMotion:false});
  $('#secondsToggle').checked=true;$('#dateToggle').checked=true;$('#zoneToggle').checked=true;$('#scaleRange').value=100;$('#scaleOutput').textContent='100%';$('#fontSelect').value='DM Sans';document.body.style.fontFamily='"DM Sans", sans-serif';document.documentElement.style.setProperty('--clock-scale',1);setBg('earth');tick();showToast('SETTINGS RESET');
}
async function init(){
  bind(); renderQuick(); renderPlanets(); el.loaderText.textContent='FINDING YOUR TIME ZONE';
  $('#secondsToggle').checked=state.seconds;$('#dateToggle').checked=state.date;$('#zoneToggle').checked=state.zone;$('#scaleRange').value=state.clockScale;$('#scaleOutput').textContent=`${state.clockScale}%`;$('#fontSelect').value=state.font;document.documentElement.style.setProperty('--clock-scale',state.clockScale/100);document.body.style.fontFamily=`"${state.font}", "DM Sans", sans-serif`;setBg(state.background);
  const restored=Boolean(state.location); const fallback=restored ? {...state.location} : {...quick[0]};
  if(!restored)try{const pos=await new Promise((resolve,reject)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:7000,maximumAge:600000}):reject());fallback.lat=pos.coords.latitude;fallback.lon=pos.coords.longitude;const d=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${fallback.lat}&lon=${fallback.lon}`,{headers:{Accept:'application/json'}}).then(assertOk).then(r=>r.json());const a=d.address||{};fallback.name=a.city||a.town||a.village||a.municipality||'Current location';fallback.country=a.country||'';fallback.code=a.country_code?.toUpperCase();}catch(e){ console.info('Using Kathmandu as initial no-permission location.'); }
  el.loaderText.textContent='SYNCING LIVE WEATHER'; setLocation(fallback); rotateQuote(); state.quoteTimer=setInterval(rotateQuote,state.quoteMs); setTimeout(()=>el.loader.classList.add('hide'),750);
}
/* Testable state entry points — every UI control delegates to this same application state. */
window.EarthNow={
  setLocation:(location)=>setLocation({...location},true),
  setCountry:(location)=>setLocation({...location},true),
  setTimezone:(zone)=>{try{Intl.DateTimeFormat('en-GB',{timeZone:zone});const loc={...state.location,zone};setLocation(loc,true);return true;}catch{return false;}},
  setPlanet:(name)=>openPlanet(name), setBackground:setBg,
  setClockFont:(font)=>{if(![...$('#fontSelect').options].some(o=>o.value===font))return false;$('#fontSelect').value=font;$('#fontSelect').dispatchEvent(new Event('change'));return true;},
  calculateSun:()=>state.astronomy, calculateMoon:()=>state.moon,
  focusEarthOnCountry:startEarthJourney, transitionToPlanet:startPlanetJourney, updateWeather:()=>getWeather(state.location), debug:()=>window.EarthNowCore.debug()
};
init();

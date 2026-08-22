const API='https://pokeapi.co/api/v2';
const $=id=>document.getElementById(id);
const colors={normal:'#9ca3af',fire:'#f97316',water:'#3b82f6',electric:'#eab308',grass:'#22c55e',ice:'#38bdf8',fighting:'#ef4444',poison:'#a855f7',ground:'#c08457',flying:'#60a5fa',psychic:'#ec4899',bug:'#84cc16',rock:'#a16207',ghost:'#8b5cf6',dragon:'#6366f1',dark:'#374151',steel:'#64748b',fairy:'#f472b6'};
const suggestions=['Pikachu','Charizard','Gengar','Lucario','Eevee'];
let current=null, cache=new Map();

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function idFromUrl(url){return Number(url.match(/(\d+)\/?$/)?.[1]||0)}
async function get(url){const r=await fetch(url);if(!r.ok)throw Error('Pokémon not found');return r.json()}
async function load(identifier){
  show('loader');hide('error');hide('pokemonView');
  try{
    const key=String(identifier).toLowerCase().trim();
    let p=cache.get(key);
    if(!p){p=await get(`${API}/pokemon/${encodeURIComponent(key)}`);cache.set(key,p);cache.set(String(p.id),p);cache.set(p.name,p)}
    current=p;
    const species=await get(p.species.url);
    const chain=await get(species.evolution_chain.url);
    render(p,species,chain);
    hide('loader');show('pokemonView');
    history.replaceState(null,'',`?pokemon=${p.name}`);
  }catch(e){hide('loader');$('error').textContent='Couldn’t find that Pokémon. Try a name such as Pikachu or a Pokédex number such as 25.';show('error')}
}
function render(p,species,chain){
  $('number').textContent=`#${String(p.id).padStart(3,'0')}`;
  $('gen').textContent=cap((species.generation?.name||'').replace('generation-','GENERATION '));
  $('art').src=p.sprites.other['official-artwork'].front_default||p.sprites.front_default;
  $('art').alt=cap(p.name);
  $('name').textContent=cap(p.name);
  $('species').textContent=species.genera?.find(x=>x.language.name==='en')?.genus||'Pokémon';
  $('types').innerHTML=p.types.map(x=>`<span class="type" style="background:${colors[x.type.name]||'#777'}">${x.type.name}</span>`).join('');
  const entry=species.flavor_text_entries.find(x=>x.language.name==='en');
  $('description').textContent=(entry?.flavor_text||'No Pokédex description available.').replace(/[\n\f]/g,' ');
  $('height').textContent=`${(p.height/10).toFixed(1)} m`;
  $('weight').textContent=`${(p.weight/10).toFixed(1)} kg`;
  $('abilities').textContent=p.abilities.map(a=>cap(a.ability.name.replaceAll('-',' '))).join(', ');
  const total=p.stats.reduce((a,s)=>a+s.base_stat,0);$('total').textContent=`TOTAL ${total}`;
  $('stats').innerHTML=p.stats.map(s=>{const n=s.stat.name.replace('special-','Sp. ');return `<div class="stat"><span>${n==='Sp. attack'?'SpA':n==='Sp. defense'?'SpD':cap(n.slice(0,3))}</span><span>${s.base_stat}</span><div class="bar"><div class="fill" style="width:${Math.min(s.base_stat/180*100,100)}%;background:${colors[p.types[0].type.name]||'#ef4444'}"></div></div><span></span></div>`}).join('');
  renderEvolution(chain.chain);
  $('prev').disabled=p.id<=1;$('next').disabled=p.id>=1025;
}
function flatten(node,out=[]){out.push({name:node.species.name, id:idFromUrl(node.species.url), details:node.evolution_details?.[0]});node.evolves_to.forEach(x=>flatten(x,out));return out}
function renderEvolution(chain){
  const list=flatten(chain);$('evolution').innerHTML=list.map((x,i)=>`${i?'<div class="arrow">→</div>':''}<div class="evo-item"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${x.id}.png" alt="${x.name}"><b>${cap(x.name)}</b><small>#${String(x.id).padStart(3,'0')}${condition(x.details)}</small></div>`).join('');
}
function condition(d){if(!d)return '';if(d.min_level)return ` · Lv. ${d.min_level}`;if(d.item)return ` · ${cap(d.item.name.replaceAll('-',' '))}`;if(d.trigger?.name==='trade')return ' · Trade';if(d.min_happiness)return ` · Happiness ${d.min_happiness}`;return ''}

function show(id){$(id).classList.remove('hidden')}function hide(id){$(id).classList.add('hidden')}
$('searchForm').addEventListener('submit',e=>{e.preventDefault();const q=$('searchInput').value;if(q)load(q)});
$('prev').onclick=()=>current&&load(current.id-1);$('next').onclick=()=>current&&load(current.id+1);
$('suggestions').innerHTML=suggestions.map(x=>`<button type="button">${x}</button>`).join('');
document.querySelectorAll('.suggestions button').forEach(b=>b.onclick=()=>{ $('searchInput').value=b.textContent;load(b.textContent) });
$('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('searchForm').requestSubmit()});
const initial=new URLSearchParams(location.search).get('pokemon')||'pikachu';load(initial);

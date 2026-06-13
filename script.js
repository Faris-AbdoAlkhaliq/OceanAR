// ── Data ──
// OBIS API — Ocean Biodiversity Information System
// Fetches real occurrence count + last sighting location for each species
const OBIS_API = 'https://api.obis.org/v3';

const CREATURES = [
  {
    name: 'Clownfish', sci: 'Amphiprioninae', emoji: '🐠', color: '#ff6b35',
    model: 'models/clownfish.glb', sciQuery: 'Amphiprioninae',
    tags: ['Coral Reef', 'Symbiotic', 'Indo-Pacific'],
    habitat: 'Coral Reefs, Indo-Pacific', diet: 'Algae, Plankton',
    depth: '1–15 m', status: 'Least Concern',
    fact: 'All clownfish are born male. When the dominant female dies, the largest male changes sex to become the new female — permanently.'
  },
  {
    name: 'Swimming Shark', sci: 'Carcharhinus sp.', emoji: '🦈', color: '#607d8b',
    model: 'models/white_shark_from_depth.glb', sciQuery: 'Carcharhinus',
    tags: ['Apex Predator', 'Open Ocean', '450M Years Old'],
    habitat: 'Open Ocean & Coastal Waters', diet: 'Fish, Rays, Mammals',
    depth: '0–600 m', status: 'Vulnerable',
    fact: 'Sharks detect the faint electrical field of a hidden prey\'s heartbeat up to 1 metre away using special organs called the Ampullae of Lorenzini.'
  },
  {
    name: 'Octopus', sci: 'Octopus vulgaris', emoji: '🐙', color: '#c2624a',
    model: 'models/animal_crossing_new_horizons_octopus.glb', sciQuery: 'Octopus vulgaris',
    tags: ['Highly Intelligent', 'Shape-Shifter', 'Coral Reef'],
    habitat: 'Coral Reefs & Rocky Seabeds', diet: 'Crabs, Shrimp, Fish',
    depth: '0–200 m', status: 'Least Concern',
    fact: 'Octopuses have three hearts, blue blood, and can edit their own RNA to adapt to cold temperatures — a ability unique in the animal kingdom.'
  },
  {
    name: 'Pufferfish', sci: 'Tetraodontidae', emoji: '🐡', color: '#e8c84a',
    model: 'models/pufferfish.glb', sciQuery: 'Tetraodontidae',
    tags: ['Toxic', 'Self-Defense', 'Tropical Seas'],
    habitat: 'Tropical & Subtropical Seas', diet: 'Algae, Shellfish',
    depth: '1–100 m', status: 'Varies by Species',
    fact: 'Pufferfish contain tetrodotoxin — 1,200× more toxic than cyanide. Yet they are a delicacy in Japan, prepared only by specially licensed chefs.'
  },
  {
    name: 'Sea Turtle', sci: 'Cheloniidae', emoji: '🐢', color: '#4a8c5c',
    model: 'models/sea_turtle_low_poly.glb', sciQuery: 'Cheloniidae',
    tags: ['Ancient Reptile', 'Endangered', 'Long-Distance'],
    habitat: 'Tropical & Subtropical Oceans', diet: 'Seagrass, Jellyfish',
    depth: '0–30 m', status: 'Endangered',
    fact: 'Sea turtles navigate thousands of kilometres using Earth\'s magnetic field — returning to the exact same beach where they were born to lay their eggs.'
  }
];

// ── Build Cards ──
const cards = document.getElementById('cards');
CREATURES.forEach(c => {
  const el = document.createElement('article');
  el.innerHTML = `
    <div class="card-stripe" style="background:${c.color}"></div>
    <div class="card-body">
      <span class="card-emoji">${c.emoji}</span>
      <div class="card-info">
        <h3>${c.name}</h3>
        <small>${c.sci}</small>
        <div class="tags">${c.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
      <span>→</span>
    </div>`;
  el.addEventListener('click', () => openViewer(c));
  cards.appendChild(el);
});

// ── Screen Navigation ──
const screens = document.querySelectorAll('.screen');
function show(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  closeInfo();
}
window.show = show; // Expose globally for HTML elements

// ── Viewer ──
const mv = document.getElementById('mv');
let infoOpen = false;

function openViewer(c) {
  show('viewer');
  mv.src = c.model;
  mv.alt = c.name;

  // Fill info card
  document.getElementById('iName').textContent    = c.name;
  document.getElementById('iSci').textContent     = c.sci;
  document.getElementById('iEmoji').textContent   = c.emoji;
  document.getElementById('iHabitat').textContent = c.habitat;
  document.getElementById('iDiet').textContent    = c.diet;
  document.getElementById('iDepth').textContent   = c.depth;
  document.getElementById('iStatus').textContent  = c.status;
  document.getElementById('iFact').textContent    = c.fact;
  fetchOBIS(c.sciQuery);
}

// Fetch live data from OBIS API
async function fetchOBIS(sciName) {
  // Reset UI
  document.getElementById('obisLoading').style.display = 'block';
  document.getElementById('obisDl').style.display      = 'none';
  document.getElementById('obisError').style.display   = 'none';

  try {
    // 1. Get total occurrence count
    const statsRes = await fetch(`${OBIS_API}/occurrence?scientificname=${encodeURIComponent(sciName)}&size=0`);
    const statsData = await statsRes.json();
    const total = statsData.total ?? 0;

    // 2. Get most recent occurrence
    const recentRes = await fetch(`${OBIS_API}/occurrence?scientificname=${encodeURIComponent(sciName)}&size=1&fields=date_year,decimalLatitude,decimalLongitude,locality,waterBody`);
    const recentData = await recentRes.json();
    const rec = recentData.results?.[0];

    // 3. Build location string
    let location = '—';
    if (rec) {
      if (rec.locality)   location = rec.locality;
      else if (rec.waterBody) location = rec.waterBody;
      else if (rec.decimalLatitude && rec.decimalLongitude)
        location = `${Math.abs(rec.decimalLatitude).toFixed(2)}°${rec.decimalLatitude >= 0 ? 'N' : 'S'}, ${Math.abs(rec.decimalLongitude).toFixed(2)}°${rec.decimalLongitude >= 0 ? 'E' : 'W'}`;
    }

    // 4. Update UI
    document.getElementById('obisCount').textContent    = total.toLocaleString() + ' records';
    document.getElementById('obisDate').textContent     = rec?.date_year ? `${rec.date_year}` : '—';
    document.getElementById('obisLocation').textContent = location;

    document.getElementById('obisLoading').style.display = 'none';
    document.getElementById('obisDl').style.display      = 'grid';

  } catch (err) {
    document.getElementById('obisLoading').style.display = 'none';
    document.getElementById('obisError').style.display   = 'block';
  }
}

// Reverted: Auto-play animation when model loads (default config)
mv.addEventListener('load', () => {
  const anim = mv.availableAnimations;
  if (anim?.length) { mv.animationName = anim[0]; mv.play(); }
  document.getElementById('arBtn').style.display = mv.canActivateAR ? 'block' : 'none';
});

// AR button
document.getElementById('arBtn').addEventListener('click', () => mv.activateAR());

// Tap model in 3D preview → toggle info
mv.addEventListener('click', e => {
  if (e.target.closest('#arBtn')) return;
  ripple(e.clientX, e.clientY);
  infoOpen ? closeInfo() : openInfo();
});

function openInfo()  {
  document.getElementById('infoCard').classList.add('open');
  infoOpen = true;
}

function closeInfo() {
  document.getElementById('infoCard').classList.remove('open');
  infoOpen = false;
}
window.closeInfo = closeInfo; // Expose globally for HTML dismiss buttons

// ── Ripple ──
function ripple(x, y) {
  const r = document.createElement('div');
  r.className = 'ripple';
  r.style.cssText = `left:${x}px;top:${y}px`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 650);
}
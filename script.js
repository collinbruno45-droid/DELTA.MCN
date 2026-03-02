// Client-side listing data and UI logic
const sampleListings = [
  {id:1,type:'Residential',title:'2-bedroom apartment',price:850,location:'Downtown',beds:2,baths:1,size:72,image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=60'},
  {id:2,type:'Business',title:'Retail space on Main St',price:2200,location:'Main St',beds:0,baths:1,size:120,image:'https://images.unsplash.com/photo-1556740769-8b3f6d4d057c?auto=format&fit=crop&w=800&q=60'},
  {id:3,type:'Residential',title:'Cozy studio',price:550,location:'Riverside',beds:0,baths:1,size:34,image:'https://images.unsplash.com/photo-1505691723518-36a4b3de47b1?auto=format&fit=crop&w=800&q=60'},
  {id:4,type:'Business',title:'Office suite — 3 rooms',price:1800,location:'Tech Park',beds:0,baths:2,size:95,image:'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=60'},
  {id:5,type:'Residential',title:'Family house with garden',price:1500,location:'Suburbia',beds:3,baths:2,size:180,image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60'},
  {id:6,type:'Business',title:'Warehouse / Workshop',price:1200,location:'Industrial Area',beds:0,baths:1,size:400,image:'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=800&q=60'}
];

const listingsGrid = document.getElementById('listingsGrid');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const radiusInput = document.getElementById('radiusInput');
const locStatus = document.getElementById('locStatus');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

let userLocation = null; // {lat, lon}

function toRad(deg){ return deg * Math.PI / 180; }
function haversineKm(a, b){
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat/2);
  const sinDLon = Math.sin(dLon/2);
  const aa = sinDLat*sinDLat + sinDLon*sinDLon*Math.cos(lat1)*Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
  return R * c;
}

function renderListings(list){
  listingsGrid.innerHTML = '';
  if(!list.length){
    listingsGrid.innerHTML = '<p>No listings found.</p>';
    return;
  }
  list.forEach(item=>{
    const card = document.createElement('article');
    card.className = 'card';
    const distanceText = (userLocation && item.lat && item.lon) ? ` • ${haversineKm(userLocation, {lat:item.lat, lon:item.lon}).toFixed(1)} km` : '';
    const hasCoords = (item.lat !== undefined && item.lon !== undefined && item.lat !== null && item.lon !== null);
    let miniMapHtml = '';
    if(hasCoords){
      miniMapHtml = `<div class="mini-map"><div id="map-${item.id}" class="map"></div></div>`;
    }

    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}"/>
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h4 class="card-title">${item.title}</h4>
          <span class="tag">${item.type}</span>
        </div>
        <div class="card-meta">${item.location} • ${item.size} m²${distanceText}</div>
        ${miniMapHtml}
        <div class="card-footer">
          <div class="price">$${item.price}/mo</div>
          <div class="card-actions">
            <button class="btn" data-id="${item.id}">View</button>
            <button class="btn secondary" data-id="${item.id}">Book</button>
          </div>
        </div>
      </div>
    `;
    listingsGrid.appendChild(card);
    // initialize leaflet map for this card if coords exist
    if(hasCoords && typeof L !== 'undefined'){
      try{
        const mapDiv = document.getElementById(`map-${item.id}`);
        if(mapDiv){
          const map = L.map(mapDiv).setView([Number(item.lat), Number(item.lon)], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          L.marker([Number(item.lat), Number(item.lon)]).addTo(map);
        }
      }catch(e){ console.warn('Leaflet init failed', e); }
    }
  });

  // Attach handlers
  document.querySelectorAll('.card .btn').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      const id = Number(ev.currentTarget.dataset.id);
      const l = sampleListings.find(x=>x.id===id);
      if(ev.currentTarget.textContent.trim()==='View') openModal(l);
      else openBooking(l);
    });
  });
}

function openModal(listing){
  modalBody.innerHTML = `
    <h3>${listing.title} <small style="color:var(--muted);font-weight:400">• ${listing.type}</small></h3>
    <img src="${listing.image}" alt="${listing.title}" style="width:100%;height:220px;object-fit:cover;border-radius:6px;margin:0.5rem 0"/>
    <p><strong>Location:</strong> ${listing.location}</p>
    <p><strong>Size:</strong> ${listing.size} m²</p>
    <p><strong>Price:</strong> $${listing.price}/mo</p>
    <hr />
    <form id="bookingForm">
      <h4>Request viewing / Book</h4>
      <input name="name" placeholder="Your name" required style="width:100%;padding:0.5rem;margin-bottom:0.5rem;border:1px solid #e3e6ef;border-radius:6px" />
      <input name="email" type="email" placeholder="Email" required style="width:100%;padding:0.5rem;margin-bottom:0.5rem;border:1px solid #e3e6ef;border-radius:6px" />
      <input name="phone" placeholder="Phone (optional)" style="width:100%;padding:0.5rem;margin-bottom:0.5rem;border:1px solid #e3e6ef;border-radius:6px" />
      <button type="submit" class="btn">Send request</button>
    </form>
  `;
  modal.classList.remove('hidden');

  document.getElementById('bookingForm').addEventListener('submit', function(e){
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    alert(`Request sent for ${listing.title} — we'll contact ${data.name} at ${data.email}`);
    modal.classList.add('hidden');
  });
}

function openBooking(listing){
  // quick booking shortcut: opens modal but pre-fills form
  openModal(listing);
}

modalClose.addEventListener('click', ()=>modal.classList.add('hidden'));
modal.addEventListener('click', (ev)=>{ if(ev.target===modal) modal.classList.add('hidden') });

function applyFilters(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const type = typeFilter.value;
  let out = sampleListings.filter(l=>{
    const matchesQ = !q || (l.title + ' ' + l.location + ' ' + l.type).toLowerCase().includes(q);
    const matchesType = type==='all' || l.type===type;
    return matchesQ && matchesType;
  });

  // If user location provided and radius set, filter by radius
  const radiusKm = Number(radiusInput?.value) || 0;
  if(userLocation && radiusKm > 0){
    out = out.filter(l => (l.lat && l.lon) && (haversineKm(userLocation, {lat:l.lat, lon:l.lon}) <= radiusKm));
  }

  // If user location present, sort by distance
  if(userLocation){
    out.sort((a,b)=>{
      const da = (a.lat&&a.lon)? haversineKm(userLocation, {lat:a.lat, lon:a.lon}) : Infinity;
      const db = (b.lat&&b.lon)? haversineKm(userLocation, {lat:b.lat, lon:b.lon}) : Infinity;
      return da - db;
    });
  }

  renderListings(out);
}

searchBtn.addEventListener('click', applyFilters);
searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') applyFilters(); });
typeFilter.addEventListener('change', applyFilters);

locBtn.addEventListener('click', ()=>{
  if(!navigator.geolocation){ locStatus.textContent = 'Geolocation not supported by this browser.'; return; }
  locStatus.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition((pos)=>{
    userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    locStatus.textContent = `Location set (${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)})`;
    applyFilters();
  }, (err)=>{
    locStatus.textContent = 'Unable to retrieve location.';
    console.warn(err);
  }, { enableHighAccuracy: true, timeout: 10000 });
});

document.getElementById('contactForm').addEventListener('submit', function(e){
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget).entries());
  alert('Thanks, ' + (data.name||'there') + '. We received your message.');
  e.currentTarget.reset();
});

// Try to fetch listings from API; fall back to sampleListings
async function loadListings(){
  try{
    const res = await fetch('/api/listings');
    if(!res.ok) throw new Error('Network');
    const data = await res.json();
    // replace sampleListings contents
    if(Array.isArray(data) && data.length) {
      // mutate sampleListings for filters to work
      sampleListings.length = 0;
      data.forEach(i=>sampleListings.push(i));
    }
  }catch(err){
    console.warn('Could not load remote listings, using sample data.');
  }
  renderListings(sampleListings);
}

loadListings();

// Admin: Add listing form handling and optional geocode
const adminForm = document.getElementById('adminForm');
const geocodeBtn = document.getElementById('geocodeBtn');
const adminStatus = document.getElementById('adminStatus');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const adminUserLabel = document.getElementById('adminUserLabel');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginClose = document.getElementById('loginClose');
const loginCancel = document.getElementById('loginCancel');
const loginStatus = document.getElementById('loginStatus');

function getToken(){ return localStorage.getItem('adminToken'); }
function setToken(t){ if(t) localStorage.setItem('adminToken', t); else localStorage.removeItem('adminToken'); }
function isLoggedIn(){ return !!getToken(); }
function updateAdminUI(){
  const logged = isLoggedIn();
  if(adminForm) adminForm.querySelectorAll('input,select,button').forEach(el=>{ if(el.type!=='button' || el.id==='geocodeBtn') el.disabled = !logged; });
  if(adminLoginBtn) adminLoginBtn.classList.toggle('hidden', logged);
  if(adminLogoutBtn) adminLogoutBtn.classList.toggle('hidden', !logged);
  adminUserLabel.textContent = logged ? 'Signed in' : '';
}

async function doLogin(user, pass){
  loginStatus.textContent = 'Signing in…';
  try{
    const res = await fetch('/api/admin/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({user, pass})});
    if(!res.ok){ const j = await res.json().catch(()=>{}); throw new Error(j && j.error ? j.error : 'Login failed'); }
    const j = await res.json();
    setToken(j.token);
    loginStatus.textContent = '';
    closeLoginModal();
    updateAdminUI();
    return true;
  }catch(err){ loginStatus.textContent = String(err.message || err); return false; }
}

function openLoginModal(){ loginModal.classList.remove('hidden'); }
function closeLoginModal(){ loginModal.classList.add('hidden'); loginStatus.textContent = ''; loginForm.reset(); }

if(adminLoginBtn) adminLoginBtn.addEventListener('click', (e)=>{ e.preventDefault(); openLoginModal(); });
if(loginClose) loginClose.addEventListener('click', closeLoginModal);
if(loginCancel) loginCancel.addEventListener('click', closeLoginModal);
if(adminLogoutBtn) adminLogoutBtn.addEventListener('click', (e)=>{ e.preventDefault(); setToken(null); updateAdminUI(); });

if(loginForm){
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(loginForm); const user = fd.get('user'); const pass = fd.get('pass');
    await doLogin(user, pass);
  });
}

// initialize admin UI state
updateAdminUI();

if(geocodeBtn){
  geocodeBtn.addEventListener('click', async ()=>{
    const form = adminForm;
    if(!form) return;
    const addr = (form.location && form.location.value) || '';
    if(!addr) { adminStatus.textContent = 'Enter an address to geocode.'; return; }
    adminStatus.textContent = 'Geocoding…';
    try{
      const q = encodeURIComponent(addr);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
      const json = await res.json();
      if(Array.isArray(json) && json.length){
        const first = json[0];
        form.lat.value = first.lat;
        form.lon.value = first.lon;
        adminStatus.textContent = `Found: ${first.display_name}`;
      }else{
        adminStatus.textContent = 'No results from geocoding.';
      }
    }catch(err){
      console.warn(err);
      adminStatus.textContent = 'Geocoding failed.';
    }
  });
}

if(adminForm){
  adminForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(adminForm);
    const body = {
      title: fd.get('title'),
      type: fd.get('type'),
      price: Number(fd.get('price')) || 0,
      location: fd.get('location'),
      beds: Number(fd.get('beds')) || 0,
      baths: Number(fd.get('baths')) || 0,
      size: Number(fd.get('size')) || 0,
      image: fd.get('image') || '',
      lat: fd.get('lat') ? Number(fd.get('lat')) : undefined,
      lon: fd.get('lon') ? Number(fd.get('lon')) : undefined
    };
    adminStatus.textContent = 'Sending…';
    try{
      const headers = {'Content-Type':'application/json'};
      const token = getToken();
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/listings', {
        method: 'POST', headers, body: JSON.stringify(body)
      });
      if(!res.ok){
        const err = await res.json().catch(()=>null);
        throw new Error(err && err.error ? err.error : 'Failed to add');
      }
      const created = await res.json();
      sampleListings.push(created);
      adminStatus.textContent = 'Listing added.';
      adminForm.reset();
      renderListings(sampleListings);
    }catch(err){
      console.warn(err);
      adminStatus.textContent = 'Error adding listing: ' + (err.message || err);
      if(String(err.message||'').toLowerCase().includes('token')){
        // if token invalid, clear and ask to login
        setToken(null); updateAdminUI(); openLoginModal();
      }
    }
  });
}

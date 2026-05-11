'use strict'

const BASE_URL = 'https://overfast-api.tekrop.fr'

/* ─── State ─── */
let allHeroes   = []
let allRoles    = []
let activeRole  = ''
let activeTab   = 'heroes'

/* ─── Util ─── */
function roleColor(role) {
  const map = { tank: '#5B8CDD', damage: '#E05252', support: '#4DC97D' }
  return map[role] || '#F99E1A'
}

function roleBadge(role) {
  const labels = { tank: '◈ TANK', damage: '◆ DAMAGE', support: '◎ SUPPORT' }
  return labels[role] || role.toUpperCase()
}

/* ─── API ─── */
async function fetchHeroes() {
  const res  = await fetch(`${BASE_URL}/heroes`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchHero(heroKey) {
  const res = await fetch(`${BASE_URL}/heroes/${heroKey}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchRoles() {
  const res = await fetch(`${BASE_URL}/roles`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/* ─── Heroes Tab ─── */
function createHeroCard(hero) {
  const card = document.createElement('div')
  card.className = 'hero-card'
  card.dataset.key  = hero.key
  card.dataset.name = hero.name.toLowerCase()
  card.dataset.role = hero.role

  card.innerHTML = `
    <img class="hero-card-img"
         src="${hero.portrait}"
         alt="${hero.name}"
         loading="lazy"
         onerror="this.style.opacity='0.3'">
    <div class="hero-card-info">
      <div class="hero-card-name">${hero.name}</div>
      <span class="hero-card-role-badge badge-${hero.role}">${roleBadge(hero.role)}</span>
      ${hero.description ? `<p class="hero-card-desc">${hero.description}</p>` : ''}
    </div>
  `
  card.addEventListener('click', () => openHeroModal(hero.key))
  return card
}

function renderHeroes(list) {
  const grid  = document.getElementById('heroes-grid')
  const count = document.getElementById('heroes-count')

  if (!list.length) {
    grid.innerHTML = '<div class="error-state">NENHUM HERÓI ENCONTRADO</div>'
    count.textContent = ''
    return
  }

  count.textContent = `${list.length} HERÓI${list.length !== 1 ? 'S' : ''} ENCONTRADO${list.length !== 1 ? 'S' : ''}`
  grid.replaceChildren(...list.map(createHeroCard))
}

function filterHeroes() {
  const query = document.getElementById('search-heroes').value.toLowerCase().trim()
  const filtered = allHeroes.filter(h => {
    const matchRole = !activeRole || h.role === activeRole
    const matchName = !query || h.name.toLowerCase().includes(query) || (h.description || '').toLowerCase().includes(query)
    return matchRole && matchName
  })
  renderHeroes(filtered)
}

async function initHeroesTab() {
  const grid = document.getElementById('heroes-grid')
  grid.innerHTML = '<div class="loader-state"><div class="ow-spinner"></div><p>CARREGANDO HERÓIS...</p></div>'

  try {
    allHeroes = await fetchHeroes()
    renderHeroes(allHeroes)
  } catch (err) {
    grid.innerHTML = `<div class="error-state">ERRO AO CARREGAR HERÓIS<br><small>${err.message}</small></div>`
  }
}

/* ─── Hero Modal ─── */
async function openHeroModal(heroKey) {
  const modal = document.getElementById('hero-modal')
  const body  = document.getElementById('modal-body')
  modal.style.display = 'flex'
  document.body.style.overflow = 'hidden'

  body.innerHTML = '<div class="loader-state" style="height:300px"><div class="ow-spinner"></div><p>CARREGANDO...</p></div>'

  try {
    const hero = await fetchHero(heroKey)

    const abilities = (hero.abilities || []).map(ab => `
      <div class="ability-row">
        <div class="ability-icon-wrap">
          <img class="ability-icon"
               src="${ab.icon}"
               alt="${ab.name}"
               onerror="this.style.opacity='0.2'">
        </div>
        <div>
          <div class="ability-name">${ab.name}</div>
          ${ab.description ? `<p class="ability-desc">${ab.description}</p>` : ''}
          ${ab.video?.mp4?.low ? `<a class="ability-video-link" href="${ab.video.mp4.low}" target="_blank">▶ VER VÍDEO</a>` : ''}
        </div>
      </div>
    `).join('')

    body.innerHTML = `
      <div class="modal-hero-banner">
        <img src="${hero.portrait}" alt="${hero.name}">
      </div>
      <div class="modal-hero-body">
        <div class="modal-hero-title">${hero.name}</div>
        <span class="hero-card-role-badge badge-${hero.role}">${roleBadge(hero.role)}</span>
        ${hero.description ? `<p class="modal-hero-desc">${hero.description}</p>` : ''}
        ${abilities ? `
          <div class="modal-abilities-title">◆ HABILIDADES</div>
          <div class="abilities-list">${abilities}</div>
        ` : ''}
      </div>
    `
  } catch (err) {
    body.innerHTML = `<div class="error-state" style="padding:2rem">ERRO AO CARREGAR HERÓI<br><small>${err.message}</small></div>`
  }
}

function closeModal() {
  document.getElementById('hero-modal').style.display = 'none'
  document.body.style.overflow = ''
}

document.getElementById('modal-close').addEventListener('click', closeModal)
document.getElementById('hero-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal()
})
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal()
})

/* ─── Roles Tab ─── */
function createRoleCard(role, heroes) {
  const card = document.createElement('div')
  card.className = 'role-card'

  const roleHeroes = heroes.filter(h => h.role === role.key)
  const pillsHtml  = roleHeroes.map(h => `
    <div class="role-hero-pill" data-herokey="${h.key}" title="${h.name}">
      <img src="${h.portrait}" alt="${h.name}" onerror="this.style.opacity='0.1'">
      ${h.name}
    </div>
  `).join('')

  card.innerHTML = `
    <div class="role-card-header">
      ${role.icon ? `<img class="role-icon" src="${role.icon}" alt="${role.name}">` : ''}
      <div>
        <div class="role-card-title" style="color:${roleColor(role.key)}">${role.name}</div>
        ${role.description ? `<p class="role-card-desc">${role.description}</p>` : ''}
      </div>
    </div>
    <div class="role-card-heroes">${pillsHtml}</div>
  `

  card.querySelectorAll('.role-hero-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      switchTab('heroes')
      setTimeout(() => {
        const searchInput = document.getElementById('search-heroes')
        const heroName = heroes.find(h => h.key === pill.dataset.herokey)?.name || ''
        searchInput.value = heroName
        filterHeroes()
      }, 100)
    })
  })

  return card
}

async function initRolesTab() {
  const grid = document.getElementById('roles-grid')
  grid.innerHTML = '<div class="loader-state"><div class="ow-spinner"></div><p>CARREGANDO FUNÇÕES...</p></div>'

  try {
    if (!allHeroes.length) allHeroes = await fetchHeroes()
    allRoles = await fetchRoles()
    grid.replaceChildren(...allRoles.map(r => createRoleCard(r, allHeroes)))
  } catch (err) {
    grid.innerHTML = `<div class="error-state">ERRO AO CARREGAR FUNÇÕES<br><small>${err.message}</small></div>`
  }
}


function switchTab(tabId) {
  activeTab = tabId

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId)
  })
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `tab-${tabId}`)
  })

  if (tabId === 'heroes' && !allHeroes.length)  initHeroesTab()
  if (tabId === 'roles')                          initRolesTab()
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
})

/* ─── Filter chips ─── */
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    activeRole = chip.dataset.role
    filterHeroes()
  })
})

/* ─── Search inputs ─── */
document.getElementById('search-heroes').addEventListener('input', filterHeroes)

/* ─── Boot ─── */
initHeroesTab()

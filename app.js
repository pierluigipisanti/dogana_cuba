// App State
let database = null;
let viaggiatoreData = null;
let currentView = 'home';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await loadDatabase();
    await loadViaggiatoreData();
    setupEventListeners();
    renderCategories();
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
});

// Load Database
async function loadDatabase() {
    try {
        const response = await fetch('aduana_cuba_db.json');
        database = await response.json();
        console.log('Database caricato:', database);
    } catch (error) {
        console.error('Errore caricamento database:', error);
        alert('Errore nel caricamento dei dati. Riprova.');
    }
}

// Load Viaggiatore Data
async function loadViaggiatoreData() {
    try {
        const response = await fetch('guida_viaggiatore_cuba.json');
        viaggiatoreData = await response.json();
        console.log('Dati viaggiatore caricati:', viaggiatoreData);
    } catch (error) {
        console.error('Errore caricamento dati viaggiatore:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    // Search Input
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query.length > 0) {
            clearSearch.classList.add('visible');
            performSearch(query);
            switchView('search');
        } else {
            clearSearch.classList.remove('visible');
            switchView('home');
        }
    });
    
    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.classList.remove('visible');
        switchView('home');
        searchInput.focus();
    });
    
    // Bottom Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch view
            if (view === 'search') {
                searchInput.focus();
            } else {
                searchInput.value = '';
                clearSearch.classList.remove('visible');
            }
            
            switchView(view);
        });
    });
}

// Switch View
function switchView(view) {
    currentView = view;
    
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('searchView').classList.add('hidden');
    document.getElementById('viaggiatoreView').classList.add('hidden');
    document.getElementById('infoView').classList.add('hidden');
    
    if (view === 'home') {
        document.getElementById('homeView').classList.remove('hidden');
    } else if (view === 'search') {
        document.getElementById('searchView').classList.remove('hidden');
    } else if (view === 'viaggiatore') {
        document.getElementById('viaggiatoreView').classList.remove('hidden');
        renderViaggiatoreContent();
    } else if (view === 'info') {
        document.getElementById('infoView').classList.remove('hidden');
    }
}

// Render Categories
function renderCategories() {
    if (!database) return;
    
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = '';
    
    database.categorie.forEach(categoria => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="icon">${categoria.icona}</div>
            <div class="name">${categoria.nome_it}</div>
        `;
        
        card.addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            searchInput.value = categoria.nome_it.split(' ')[0].toLowerCase();
            searchInput.dispatchEvent(new Event('input'));
        });
        
        grid.appendChild(card);
    });
}

// Perform Search
function performSearch(query) {
    if (!database) return;
    
    const results = searchArticles(query.toLowerCase());
    renderSearchResults(results, query);
}

// Search Engine
function searchArticles(query) {
    const results = [];
    
    database.categorie.forEach(categoria => {
        categoria.articoli.forEach(articolo => {
            let score = 0;
            
            // Check exact match in nome_it
            if (articolo.nome_it.toLowerCase().includes(query)) {
                score += 10;
            }
            
            // Check sinonimi
            if (articolo.sinonimi) {
                articolo.sinonimi.forEach(sinonimo => {
                    if (sinonimo.toLowerCase().includes(query)) {
                        score += 8;
                    }
                });
            }
            
            // Check nome_es
            if (articolo.nome_es && articolo.nome_es.toLowerCase().includes(query)) {
                score += 5;
            }
            
            // Check category name
            if (categoria.nome_it.toLowerCase().includes(query)) {
                score += 3;
            }
            
            if (score > 0) {
                results.push({
                    articolo: articolo,
                    categoria: categoria,
                    score: score
                });
            }
        });
    });
    
    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);
    
    return results;
}

// Render Search Results
function renderSearchResults(results, query) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>Nessun risultato</h3>
                <p>Non ho trovato articoli per "${query}"</p>
                <p style="margin-top: 12px;">Prova con termini diversi come: computer, telefono, frigorifero, ecc.</p>
            </div>
        `;
        return;
    }
    
    results.forEach(result => {
        const card = createResultCard(result.articolo, result.categoria);
        container.appendChild(card);
    });
}

// Create Result Card
function createResultCard(articolo, categoria) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    // Quantity Info
    let quantityHTML = '';
    if (articolo.quantita_max === 'illimitata (temporaneamente)') {
        quantityHTML = `
            <div class="quantity-badge" style="background: var(--success);">
                ✓ ILLIMITATO (temporaneo)
            </div>
        `;
    } else if (articolo.quantita_max === 'variabile') {
        quantityHTML = `
            <div class="quantity-badge" style="background: var(--warning);">
                ⚠️ Quantità variabile
            </div>
        `;
    } else if (articolo.quantita_max) {
        quantityHTML = `
            <div class="quantity-badge">
                ✓ Massimo: ${articolo.quantita_max} ${articolo.unita || 'pezzi'}
            </div>
        `;
    }
    
    // Additional Info
    let additionalHTML = '';
    
    if (articolo.valore_max_per_articolo_usd) {
        additionalHTML += `
            <div class="note">
                💵 Valore massimo per articolo: ${articolo.valore_max_per_articolo_usd} USD
            </div>
        `;
    }
    
    if (articolo.autorizzazione_richiesta) {
        additionalHTML += `
            <div class="important">
                ⚠️ RICHIEDE AUTORIZZAZIONE PREVENTIVA
            </div>
        `;
    }
    
    if (articolo.importante) {
        additionalHTML += `
            <div class="important">
                ⚠️ ${articolo.importante}
            </div>
        `;
    }
    
    if (articolo.note) {
        additionalHTML += `
            <div class="note">
                ℹ️ ${articolo.note}
            </div>
        `;
    }
    
    if (articolo.condizioni) {
        additionalHTML += `
            <div class="note">
                📋 Condizioni: ${articolo.condizioni}
            </div>
        `;
    }
    
    if (articolo.metodo_valorazione) {
        additionalHTML += `
            <div class="note">
                ⚖️ Valorazione: ${articolo.metodo_valorazione}
                ${articolo.equivalenza ? ` (${articolo.equivalenza})` : ''}
            </div>
        `;
    }
    
    card.innerHTML = `
        <h3>${categoria.icona} ${articolo.nome_it}</h3>
        <div class="category">${categoria.nome_it}</div>
        ${quantityHTML}
        ${additionalHTML}
    `;
    
    return card;
}

// Render Viaggiatore Content
function renderViaggiatoreContent() {
    if (!viaggiatoreData) {
        document.getElementById('viaggiatoreContent').innerHTML = `
            <div class="info-card">
                <p>Errore nel caricamento dei dati. Riprova.</p>
            </div>
        `;
        return;
    }
    
    const container = document.getElementById('viaggiatoreContent');
    container.innerHTML = '';
    
    // Render each section
    viaggiatoreData.sezioni.forEach(sezione => {
        const card = createViaggiatoreCard(sezione);
        container.appendChild(card);
    });
}

// Create Viaggiatore Card
function createViaggiatoreCard(sezione) {
    const card = document.createElement('div');
    card.className = 'info-card';
    card.style.marginBottom = '20px';
    
    let html = `<h2>${sezione.icona} ${sezione.titolo}</h2>`;
    
    // Render content based on section ID
    switch(sezione.id) {
        case 'elettricita':
            html += renderElettricita(sezione.contenuto);
            break;
        case 'internet_sim':
            html += renderInternetSim(sezione.contenuto);
            break;
        case 'moneta_pagamenti':
            html += renderMonetaPagamenti(sezione.contenuto);
            break;
        case 'trasporti':
            html += renderTrasporti(sezione.contenuto);
            break;
        case 'ambasciata':
            html += renderAmbasciata(sezione.contenuto);
            break;
        case 'emergenze':
            html += renderEmergenze(sezione.contenuto);
            break;
        case 'salute':
            html += renderSalute(sezione.contenuto);
            break;
        case 'consigli_pratici':
            html += renderConsigliPratici(sezione.contenuto);
            break;
        default:
            html += '<p>Sezione in costruzione</p>';
    }
    
    card.innerHTML = html;
    return card;
}

// Render Functions for Each Section

function renderElettricita(contenuto) {
    return `
        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; border-left: 4px solid #DC2626; margin-bottom: 15px;">
            <strong>⚠️ ${contenuto.avviso_importante}</strong>
        </div>
        
        <div style="margin-bottom: 15px;">
            <p><strong>Voltaggio:</strong> ${contenuto.voltaggio}</p>
            <p><strong>Tipo prese:</strong> ${contenuto.tipo_prese}</p>
            <p><strong>Adattatore necessario:</strong> ${contenuto.adattatore_necessario ? '✅ SÌ' : '❌ NO'}</p>
        </div>
        
        <p>${contenuto.note}</p>
        
        <div style="margin-top: 15px;">
            <strong>💡 Consigli:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.consigli.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;
}

function renderInternetSim(contenuto) {
    let html = `
        <p><strong>Operatore unico:</strong> ${contenuto.operatore_unico}</p>
        
        <h3 style="margin-top: 20px; color: var(--primary);">📱 SIM Card per Turisti</h3>
    `;
    
    contenuto.sim_turisti.opzioni.forEach(opzione => {
        html += `
            <div style="background: #F0F9FF; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid var(--primary);">
                <strong>${opzione.nome}</strong><br>
                <span style="font-size: 13px; color: var(--text-gray);">
                    Durata: ${opzione.durata} | Dati: ${opzione.dati} | Minuti: ${opzione.minuti} | SMS: ${opzione.sms}
                </span>
                ${opzione.extra ? `<br><span style="font-size: 13px;">✨ ${opzione.extra}</span>` : ''}
                <br><strong style="color: var(--primary);">Costo indicativo: ${opzione.costo_indicativo}</strong>
                <br><span style="font-size: 12px; color: var(--text-gray);">${opzione.estendibile}</span>
            </div>
        `;
    });
    
    html += `
        <div style="margin-top: 15px;">
            <strong>📍 Dove comprare:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.sim_turisti.dove_comprare.map(d => `<li>${d}</li>`).join('')}
            </ul>
        </div>
        
        <h3 style="margin-top: 20px; color: var(--primary);">📶 WiFi Pubblico</h3>
        <p>${contenuto.wifi_pubblico.disponibilita}</p>
        <p><strong>Come riconoscere:</strong> ${contenuto.wifi_pubblico.come_riconoscere}</p>
        
        <div style="margin-top: 15px;">
            <strong>💡 Consigli:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.consigli.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;
    
    return html;
}

function renderMonetaPagamenti(contenuto) {
    let html = `
        <div style="background: #F0F9FF; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid var(--primary);">
            <strong>Moneta ufficiale:</strong> ${contenuto.moneta_ufficiale.nome} (${contenuto.moneta_ufficiale.simbolo})<br>
            <strong>Cambio:</strong> ${contenuto.moneta_ufficiale.cambio_ufficiale}
            <br><span style="font-size: 13px; color: var(--text-gray);">${contenuto.moneta_ufficiale.note}</span>
        </div>
        
        <h3 style="color: var(--primary);">💳 Carte Accettate</h3>
        <div style="display: flex; gap: 20px; margin: 10px 0;">
            <div style="flex: 1;">
                <strong style="color: var(--success);">Funzionano:</strong>
                <ul style="margin-top: 8px;">
                    ${contenuto.carte_accettate.funzionano.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
            <div style="flex: 1;">
                <strong style="color: var(--danger);">NON funzionano:</strong>
                <ul style="margin-top: 8px;">
                    ${contenuto.carte_accettate.non_funzionano.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        </div>
        <p style="font-size: 13px; color: var(--text-gray);">Commissioni: ${contenuto.carte_accettate.commissioni}</p>
        
        <h3 style="margin-top: 20px; color: var(--primary);">🏦 Dove Cambiare</h3>
    `;
    
    contenuto.dove_cambiare.forEach(luogo => {
        const bgColor = luogo.consigliato ? '#ECFDF5' : '#F9FAFB';
        const borderColor = luogo.consigliato ? 'var(--success)' : '#E5E7EB';
        html += `
            <div style="background: ${bgColor}; padding: 12px; border-radius: 8px; margin: 10px 0; border-left: 4px solid ${borderColor};">
                <strong>${luogo.luogo}</strong> ${luogo.consigliato ? '✅ Consigliato' : ''}<br>
                <span style="font-size: 13px;">Cambio: ${luogo.cambio} | Commissione: ${luogo.commissione || 'N/D'}</span>
                ${luogo.note ? `<br><span style="font-size: 12px; color: var(--text-gray);">${luogo.note}</span>` : ''}
                ${luogo.avviso ? `<br><span style="font-size: 12px; color: var(--danger);">${luogo.avviso}</span>` : ''}
            </div>
        `;
    });
    
    html += `
        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid var(--danger);">
            <strong>💡 Consigli Pratici:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.consigli_pratici.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
        
        <p style="margin-top: 15px;"><strong>Budget indicativo:</strong> ${contenuto.budget_indicativo}</p>
    `;
    
    return html;
}

function renderTrasporti(contenuto) {
    let html = `<h3 style="color: var(--primary);">🚕 Taxi</h3>`;
    
    contenuto.taxi.tipi.forEach(tipo => {
        html += `
            <div style="background: #F9FAFB; padding: 12px; border-radius: 8px; margin: 10px 0; border-left: 4px solid var(--primary);">
                <strong>${tipo.nome}</strong><br>
                <span style="font-size: 13px;">${tipo.caratteristiche}</span><br>
                <span style="font-size: 13px; color: var(--primary);"><strong>Costo:</strong> ${tipo.costo}</span>
                ${tipo.note ? `<br><span style="font-size: 12px; color: var(--text-gray);">${tipo.note}</span>` : ''}
                ${tipo.dove_trovarli ? `<br><span style="font-size: 12px;">📍 ${tipo.dove_trovarli}</span>` : ''}
            </div>
        `;
    });
    
    html += `
        <div style="margin-top: 15px;">
            <strong>💡 Consigli:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.taxi.consigli.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
        
        <h3 style="margin-top: 20px; color: var(--primary);">🚌 Autobus</h3>
        <div style="background: #F0F9FF; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid var(--primary);">
            <strong>${contenuto.autobus.viazul.descrizione}</strong><br>
            <span style="font-size: 13px;">${contenuto.autobus.viazul.caratteristiche}</span><br>
            <span style="font-size: 13px;"><strong>Prenotazione:</strong> ${contenuto.autobus.viazul.prenotazione}</span><br>
            <span style="font-size: 13px;"><strong>Costo:</strong> ${contenuto.autobus.viazul.costo}</span><br>
            <span style="font-size: 12px; color: var(--text-gray);">${contenuto.autobus.viazul.note}</span>
        </div>
        
        <h3 style="margin-top: 20px; color: var(--primary);">🚗 Noleggio Auto</h3>
        <p><strong>Compagnie:</strong> ${contenuto.noleggio_auto.compagnie.join(', ')}</p>
        <p><strong>Costo:</strong> ${contenuto.noleggio_auto.costo}</p>
        <div style="margin-top: 10px;">
            <strong>Requisiti:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.noleggio_auto.requisiti.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
        <div style="margin-top: 10px;">
            <strong>💡 Consigli:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.noleggio_auto.consigli.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;
    
    return html;
}

function renderAmbasciata(contenuto) {
    return `
        <div style="background: #F0F9FF; padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary);">
            <strong>${contenuto.nome}</strong><br>
            <p style="margin-top: 8px;">📍 ${contenuto.indirizzo}</p>
            <p>📞 ${contenuto.telefono}</p>
            <p>✉️ <a href="mailto:${contenuto.email_consolare}" style="color: var(--primary);">${contenuto.email_consolare}</a></p>
            <p>🌐 <a href="${contenuto.sito_web}" target="_blank" style="color: var(--primary);">Sito web</a></p>
            <p style="margin-top: 10px;"><strong>Orari:</strong> Lunedì-Venerdì ${contenuto.orari.lunedi}</p>
        </div>
        
        <div style="margin-top: 15px;">
            <strong>Servizi:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.servizi.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>
        
        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid var(--danger);">
            <strong>🚨 Emergenza 24h:</strong><br>
            <span style="font-size: 13px;">${contenuto.emergenza_24h}</span>
        </div>
        
        <div style="margin-top: 15px;">
            <strong>💡 Consigli:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.consigli.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;
}

function renderEmergenze(contenuto) {
    let html = '<div style="display: grid; gap: 10px; margin-bottom: 20px;">';
    
    contenuto.numeri_emergenza.forEach(numero => {
        html += `
            <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; border-left: 4px solid var(--danger); display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${numero.icona}</span>
                <div>
                    <strong>${numero.servizio}</strong><br>
                    <span style="font-size: 20px; color: var(--danger);"><strong>${numero.numero}</strong></span>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        
        <h3 style="color: var(--primary);">🏥 ${contenuto.assistenza_turistica.nome}</h3>
        <p>${contenuto.assistenza_turistica.descrizione}</p>
        <p><strong>Telefono:</strong> ${contenuto.assistenza_turistica.telefono}</p>
        <div style="margin-top: 10px;">
            <strong>Servizi:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.assistenza_turistica.servizi.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>
        
        <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid var(--success);">
            <strong>💡 Consigli di Sicurezza:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.consigli_sicurezza.map(c => `<li>${c}</li>`).join('')}
            </ul>
        </div>
    `;
    
    return html;
}

function renderSalute(contenuto) {
    let html = `
        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; border-left: 4px solid var(--danger); margin-bottom: 20px;">
            <strong>⚠️ ${contenuto.assicurazione_obbligatoria.descrizione}</strong><br>
            <span style="font-size: 13px; margin-top: 8px; display: block;">Copertura minima: ${contenuto.assicurazione_obbligatoria.copertura_minima}</span>
            <span style="font-size: 13px;">Costo indicativo: ${contenuto.assicurazione_obbligatoria.costo_indicativo}</span>
        </div>
        
        <h3 style="color: var(--primary);">💊 Medicinali da Portare</h3>
        <ul style="margin-top: 10px;">
            ${contenuto.medicinali_da_portare.map(m => `<li>${m}</li>`).join('')}
        </ul>
        
        <h3 style="margin-top: 20px; color: var(--primary);">💧 Acqua e Cibo</h3>
        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin-top: 10px; border-left: 4px solid var(--danger);">
            <strong>Acqua:</strong> ${contenuto.acqua_cibo.acqua}<br>
            <strong>Ghiaccio:</strong> ${contenuto.acqua_cibo.ghiaccio}<br>
            <strong>Frutta:</strong> ${contenuto.acqua_cibo.frutta}
        </div>
        
        <h3 style="margin-top: 20px; color: var(--primary);">💉 Vaccinazioni</h3>
        <p><strong>Obbligatorie:</strong> ${contenuto.vaccinazioni.obbligatorie}</p>
        <div style="margin-top: 10px;">
            <strong>Consigliate:</strong>
            <ul style="margin-top: 8px;">
                ${contenuto.vaccinazioni.consigliate.map(v => `<li>${v}</li>`).join('')}
            </ul>
        </div>
    `;
    
    return html;
}

function renderConsigliPratici(contenuto) {
    let html = `
        <h3 style="color: var(--primary);">⚠️ Truffe Comuni da Evitare</h3>
    `;
    
    contenuto.truffe_comuni.forEach(truffa => {
        html += `
            <div style="background: #FEF2F2; padding: 12px; border-radius: 8px; margin: 10px 0; border-left: 4px solid var(--danger);">
                <strong>${truffa.tipo}</strong><br>
                <span style="font-size: 13px;">${truffa.descrizione}</span><br>
                <span style="font-size: 13px; color: var(--success);"><strong>Come evitare:</strong> ${truffa.come_evitare}</span>
            </div>
        `;
    });
    
    html += `
        <h3 style="margin-top: 20px; color: var(--danger);">❌ Cosa NON Fare</h3>
        <ul style="margin-top: 10px;">
            ${contenuto.cosa_non_fare.map(c => `<li>${c}</li>`).join('')}
        </ul>
        
        <h3 style="margin-top: 20px; color: var(--success);">✅ Cosa Portare</h3>
        <ul style="margin-top: 10px;">
            ${contenuto.cosa_portare.map(c => `<li>${c}</li>`).join('')}
        </ul>
        
        <h3 style="margin-top: 20px; color: var(--primary);">💰 Mance</h3>
        <ul style="margin-top: 10px;">
            <li>Ristoranti: ${contenuto.mance.ristoranti}</li>
            <li>Taxi: ${contenuto.mance.taxi}</li>
            <li>Guide turistiche: ${contenuto.mance.guide_turistiche}</li>
            <li>Hotel: ${contenuto.mance.hotel}</li>
        </ul>
        <p style="font-size: 13px; color: var(--text-gray); margin-top: 8px;">${contenuto.mance.note}</p>
        
        <h3 style="margin-top: 20px; color: var(--primary);">🗣️ Lingua</h3>
        <p><strong>Ufficiale:</strong> ${contenuto.lingua.ufficiale}</p>
        <p><strong>Inglese:</strong> ${contenuto.lingua.inglese}</p>
        <p style="font-size: 13px; color: var(--text-gray);">${contenuto.lingua.consiglio}</p>
    `;
    
    return html;
}

// Install PWA Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button (optional)
    console.log('PWA installabile');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installata!');
    deferredPrompt = null;
});

/* App sharing only: never derive a public link from a lesson, query or session URL. */
(() => {
  const script = document.currentScript;
  const id = script?.dataset.shareApp || location.hostname.split('.')[0];
  const apps = {
    studio: ['Studio', '#096cdb', '/', 'Docentenomgeving'],
    muziek: ['Muziek', '#7545e8', '/', 'Nederlands leren met muziek'],
    digibord: ['DigiBord', '#0090f2', '/', 'Lesmateriaal op het digibord'],
    actief: ['Actief', '#0090f2', '/', 'Samen oefenen met Nederlands'],
    spreektijd: ['Spreektijd', '#c76349', '/', 'Samen Nederlands spreken'],
    klankstudio: ['Klankstudio', '#285f47', '/', '46 Nederlandse klanken en spellingpatronen'],
    missies: ['Missies', '#59402d', '/#docent', 'Missies voor je les'],
    oppad: ['Op Pad', '#096cdb', '/docent/', 'Nederlands oefenen buiten de les'],
    theaterlezen: ['Theaterlezen', '#a27722', '/', 'Samen lezen en spelen'],
    zinnen: ['Zinnen', '#91472f', '/', 'Oefenen met Nederlandse zinnen'],
    lexicon: ['Lexicon', '#285f47', '/', 'Taalroute Lexicon'],
    scenario: ['Scenario', '#c76349', '/', 'Samen oefenen in situaties'],
    klink: ['KLINK', '#47335c', '/', 'Nederlands leren met KLINK']
  };
  if (!apps[id] || window.TaalrouteShare) return;
  const [name, , path, description] = apps[id];
  const root = `https://${id}.taalroute.nl/`, url = new URL(path, root).href;
  const image = new URL(['studio','klink'].includes(id) ? 'share-card.png' : 'share-card.webp', script.src).href;
  const paths = {
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98m-.01-10.98-6.82 3.98"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    close: '<path d="m18 6-12 12M6 6l12 12"/>'
  };
  const icon = key => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]}</svg>`;
  let dialog, opener;
  const shareUrl = method => id === 'klankstudio' ? new URL(`delen/${method.replace(/\/+$/, "")}/`, root).href : url;
  function status(message) { dialog.querySelector('[data-share-status]').textContent = message; }
  function setPanel(social) {
    dialog.querySelector('[data-share-main]').hidden = social;
    dialog.querySelector('[data-share-social]').hidden = !social;
    dialog.querySelector('h2').textContent = social ? 'Delen via social media' : `${name} delen`;
    status('');
    dialog.querySelector(social ? '[data-share-back]' : '[data-share-copy]').focus();
  }
  async function copy(link, message = 'Link gekopieerd.') {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(link); status(message);
    } catch {
      const field = dialog.querySelector('[data-share-url]');
      field.value = link; field.parentElement.hidden = false; field.focus(); field.select();
      status('Kopiëren lukte niet. Kopieer de geselecteerde link.');
    }
  }
  async function device(link, label = '') {
    if (navigator.share) {
      try { await navigator.share({title:`Taalroute ${name}`, text:description, url:link}); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    await copy(link, label ? `Link gekopieerd. Open ${label} om hem te delen.` : 'Link gekopieerd. Plak hem in de app waarmee je wilt delen.');
  }
  async function shareImage() {
    const asset = id === 'klankstudio' ? new URL('../../assets/social/instagram-tiktok-story.png', script.src).href : image;
    try {
      const response = await fetch(asset); if (!response.ok) throw new Error('Image unavailable');
      const blob = await response.blob(), file = new File([blob], `taalroute-${id}.${blob.type === 'image/png' ? 'png' : 'webp'}`, {type:blob.type});
      if (navigator.canShare?.({files:[file]}) && navigator.share) {
        try { await navigator.share({files:[file], title:`Taalroute ${name}`, text:description, url:shareUrl('social-media/')}); return; }
        catch (error) { if (error.name === 'AbortError') return; }
      }
      const objectUrl = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = objectUrl; link.download = file.name; link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      status('Afbeelding opgeslagen. Voeg deze zelf toe in Instagram of TikTok.');
    } catch { status('De afbeelding kon niet worden geladen. Probeer opnieuw of kopieer de link.'); }
  }
  function platform(label) {
    const link = shareUrl('social-media/'), u = encodeURIComponent(link), text = encodeURIComponent(description+' '+link);
    const destinations = {
      WhatsApp:`https://wa.me/?text=${text}`,
      LinkedIn:`https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      Facebook:`https://www.facebook.com/sharer/sharer.php?u=${u}`,
      Reddit:`https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent('Taalroute '+name)}`,
      X:`https://twitter.com/intent/tweet?text=${text}`,
      Bluesky:`https://bsky.app/intent/compose?text=${text}`,
      Telegram:`https://t.me/share/url?url=${u}&text=${encodeURIComponent(description)}`,
      Threads:`https://www.threads.net/intent/post?text=${text}`
    };
    if (label === 'Instagram / TikTok') return shareImage();
    if (!destinations[label]) return device(link, label === 'Meer apps' ? '' : label);
    window.open(destinations[label], '_blank', 'noopener,noreferrer');
  }
  function createDialog() {
    dialog = document.createElement('dialog'); dialog.className = 'tr-share-dialog';
    dialog.dataset.shareApp = id; dialog.setAttribute('aria-labelledby','tr-share-title');
    dialog.innerHTML = `<div class="tr-share-top"><div><h2 id="tr-share-title">${name} delen</h2><p>Kies hoe je ${name} wilt delen.</p></div><button type="button" data-share-close aria-label="Delen sluiten">${icon('close')}</button></div><div data-share-main class="tr-share-actions"><button type="button" data-share-copy>${icon('link')}<span><strong>Kopieer link</strong><small>Voor e-mail of een ander bericht</small></span></button><button type="button" data-share-networks>${icon('share')}<span><strong>Social media</strong><small>Kies een sociale app</small></span></button><button type="button" data-share-more>${icon('more')}<span><strong>Meer deelopties</strong><small>Deel via je apparaat</small></span></button></div><div data-share-social hidden><button type="button" data-share-back>Terug</button><div class="tr-share-platforms">${['WhatsApp','Signal','LinkedIn','Facebook','Reddit','X','Bluesky','Telegram','Mastodon','Threads','Instagram / TikTok','Meer apps'].map(label=>`<button type="button" data-share-platform="${label}">${label}</button>`).join('')}</div></div><figure class="tr-share-preview"><img src="${image}" alt="Voorbeeldkaart van Taalroute ${name}"><figcaption><small>Voorbeeld</small><strong>Taalroute ${name}</strong><span>${description}</span></figcaption></figure>${id==='lexicon'?'<p>Voor het gebruik van Lexicon moet de ontvanger inloggen.</p>':''}<label class="tr-share-link" hidden>Link<input type="url" readonly data-share-url></label><p class="tr-share-status" role="status" aria-live="polite" data-share-status></p>`;
    document.body.append(dialog);
    dialog.querySelector('[data-share-close]').addEventListener('click',()=>dialog.close());
    dialog.querySelector('[data-share-copy]').addEventListener('click',()=>copy(shareUrl('kopieer-link/')));
    dialog.querySelector('[data-share-more]').addEventListener('click',()=>device(shareUrl('meer/')));
    dialog.querySelector('[data-share-networks]').addEventListener('click',()=>setPanel(true));
    dialog.querySelector('[data-share-back]').addEventListener('click',()=>setPanel(false));
    for (const button of dialog.querySelectorAll('[data-share-platform]')) button.addEventListener('click',()=>platform(button.dataset.sharePlatform));
    // Capture Escape before lesson shortcuts; dismissing this dialog must not end a lesson.
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dialog.close();}},true);
    dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus();});
  }
  function mount(panel) {
    if (!panel || panel.querySelector('[data-share-app-trigger]')) return;
    // Only the app-wide Klankstudio action is replaced; contextual lesson sharing is untouched.
    const old = id === 'klankstudio' ? panel.querySelector('#share-open') : null;
    const button = document.createElement('button'); button.type='button'; button.dataset.shareAppTrigger=id;
    button.innerHTML=icon('share')+'<span>Delen</span>';
    if (old) { old.hidden=true; old.after(button); } else panel.append(button);
    button.addEventListener('click',()=>{
      opener=panel.closest('details')?.querySelector(':scope > summary') || (panel.id && document.querySelector(`[aria-controls="${CSS.escape(panel.id)}"],[popovertarget="${CSS.escape(panel.id)}"]`)) || button;
      const menu=panel.closest('details'); if(menu)menu.open=false;
      if(panel.matches(':popover-open'))panel.hidePopover();
      if(!dialog)createDialog();
      dialog.querySelector('[data-share-url]').parentElement.hidden=true;
      dialog.showModal();setPanel(false);
    });
  }
  window.TaalrouteShare={mount};
})();

/* Shared menu presentation; original application controls and handlers stay intact. */
(() => {
  if (window.TaalrouteMenu) return;
  const paths = {
    'notebook-text': '<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9.5 8h5M9.5 12H16M9.5 16H14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6.25 6.25 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
    monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>',
    'arrow-up-right': '<path d="M7 7h10v10M7 17 17 7"/>'
  };
  const icon = name => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || ''}</svg>`;
  const labels = {light: 'Licht', dark: 'Donker', system: 'Volg apparaat'};
  function mount(panel, manual) {
    if (!panel || panel.classList.contains('tr-settings-panel')) return;
    panel.classList.add('tr-settings-panel');
    manual ||= panel.querySelector('a');
    if (manual) {
      manual.classList.add('tr-menu-manual');
      manual.innerHTML = icon('notebook-text') + '<span>Docentenhandleiding</span>' + (manual.target === '_blank' ? icon('arrow-up-right') : '');
      panel.prepend(manual);
    }
    if (!window.TaalrouteAppearance) return;
    const appearance = document.createElement('div');
    appearance.className = 'tr-menu-appearance';
    appearance.innerHTML = '<div class="tr-menu-label"><span>Kleurstand</span><span data-current-appearance></span></div><div class="tr-menu-modes" role="group" aria-label="Kleurstand">' + Object.entries(labels).map(([mode,label]) => `<button type="button" data-appearance-choice="${mode}" aria-label="${label}" title="${label}" aria-pressed="false">${icon(mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'monitor')}</button>`).join('') + '</div><p class="tr-menu-message" role="status"></p>';
    if (manual) manual.after(appearance); else panel.prepend(appearance);
    appearance.addEventListener('click', event => { const button = event.target.closest('[data-appearance-choice]'); if (button) window.TaalrouteAppearance.set(button.dataset.appearanceChoice); });
    sync(appearance);
    window.TaalrouteShare?.mount(panel);
  }
  function sync(appearance) {
      const api = window.TaalrouteAppearance;
      appearance.querySelector('[data-current-appearance]').textContent = labels[api.preference];
      appearance.querySelectorAll('[data-appearance-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.appearanceChoice === api.preference)));
      appearance.querySelector('.tr-menu-message').textContent = api.message;
  }
  window.addEventListener('taalroute:appearance', () => document.querySelectorAll('.tr-menu-appearance').forEach(sync));
  window.TaalrouteMenu = {mount, icon};
})();

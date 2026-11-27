/* HubSpot contact intake is independent of optional website analytics. */
(function () {
  'use strict';
  var key = 'executxr-analytics-consent-v1';
  var signal = navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  var choice = null;
  try { choice = localStorage.getItem(key); } catch (_) {}
  var loaded = false;
  function allowed() { return choice === 'yes' && !signal; }
  function safePath() {
    var qs = new URLSearchParams();
    var incoming = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
      var value = incoming.get(k);
      if (value && /^[a-z0-9_.-]{1,100}$/i.test(value)) qs.set(k, value);
    });
    return location.pathname + (qs.size ? '?' + qs.toString() : '');
  }
  function loadAnalytics() {
    if (!allowed() || loaded) return;
    // HubSpot also reads window.location independently of setPath. Clean the
    // address before loading any third-party tracker, not just its API input.
    history.replaceState(history.state, '', safePath());
    loaded = true;
    window._hsq = window._hsq || [];
    window._hsq.push(['doNotTrack', {track:true}]);
    window._hsq.push(['setPath', safePath()]);
    var script = document.createElement('script');
    script.src = 'https://js-eu1.hs-scripts.com/25692968.js';
    script.async = true; script.defer = true; script.id = 'hs-script-loader';
    document.head.appendChild(script);
  }
  var panel;
  function showSettings() {
    if (panel) { panel.hidden = false; return; }
    panel = document.createElement('section');
    panel.setAttribute('aria-label','Website analytics preferences');
    panel.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:650px;z-index:10000;padding:20px;background:#fff;color:#1c1b1a;border:1px solid #827d74;box-shadow:0 4px 20px #0002;font:16px/1.5 Arial,sans-serif';
    var nl = document.documentElement.lang === 'nl';
    var text = document.createElement('p'); text.style.margin='0 0 12px';
    text.textContent = nl ? 'Met uw toestemming gebruiken we HubSpot om websitebezoeken te meten en, na een aanvraag, aan uw contactprofiel te koppelen. Het formulier werkt ook zonder deze tracking.' : 'With your permission, we use HubSpot to measure website visits and link them to your contact profile after an enquiry. Forms also work without this tracking.';
    panel.appendChild(text);
    [['no',nl?'Zonder tracking':'Without tracking'],['yes',nl?'Tracking toestaan':'Allow tracking']].forEach(function (item) {
      var btn=document.createElement('button');btn.type='button';btn.textContent=item[1];btn.style.cssText='margin:4px 12px 4px 0;padding:10px 14px;background:white;color:#1c1b1a;border:1px solid #827d74;font:inherit;cursor:pointer';
      if (item[0]==='yes' && signal) { btn.disabled=true;btn.title='Your browser privacy signal disables tracking'; }
      btn.addEventListener('click',function(){
        choice=item[0];try {localStorage.setItem(key,choice);}catch(_){}
        panel.hidden=true;
        if (choice==='yes') loadAnalytics();
        else if (loaded) { window._hsq.push(['doNotTrack']); window._hsp=window._hsp||[];window._hsp.push(['revokeCookieConsent']);location.reload(); }
      });panel.appendChild(btn);
    });document.body.appendChild(panel);
  }
  document.querySelectorAll('[data-privacy-settings]').forEach(function(btn){btn.addEventListener('click',showSettings);});
  if (!document.querySelector('[data-privacy-settings]')) {
    var settings=document.createElement('button');settings.type='button';settings.textContent='Privacy preferences';settings.style.cssText='display:block;margin:20px auto;padding:8px 14px;background:transparent;border:1px solid currentColor;color:inherit;font:14px Arial;cursor:pointer';settings.addEventListener('click',showSettings);document.body.appendChild(settings);
  }
  loadAnalytics();
  if (!choice && !signal) showSettings();
  var form=document.getElementById('concept-form');if(!form)return;
  document.querySelectorAll('[data-concept]').forEach(function(link){link.addEventListener('click',function(){form.elements.concept.value=link.dataset.concept;});});
  var sending=false;
  form.addEventListener('submit',async function(event){
    event.preventDefault();if(sending||!form.reportValidity())return;
    var status=document.getElementById('form-status'),button=form.querySelector('[type=submit]');
    sending=true;button.disabled=true;button.textContent='Verzenden…';status.textContent='';
    var data=new FormData(form),path=safePath();
    var details=['ExecutXR — Beleef uw verhaal','Concept: '+data.get('concept'),'Organisatie: '+data.get('organisation'),'Bron: '+path,'','Vraag: '+(data.get('message')||'(niet ingevuld)')].join('\n');
    var context={pageUri:location.origin+path,pageName:'ExecutXR — Beleef uw verhaal'};
    var cookie=document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
    if(allowed()&&cookie)context.hutk=cookie[1];
    var payload={fields:['email','firstname','lastname'].map(function(name){return {objectTypeId:'0-1',name:name,value:String(data.get(name)).trim()};}).concat([{objectTypeId:'0-1',name:'message',value:details}]),context:context,legalConsentOptions:{consent:{consentToProcess:true,text:'ExecutXR mag mijn gegevens gebruiken om mijn aanvraag te beantwoorden. Mijn gegevens worden hiervoor in HubSpot verwerkt. Dit is geen nieuwsbriefinschrijving.',communications:[]}}};
    try{
      var response=await fetch('https://api.hsforms.com/submissions/v3/integration/submit/25692968/6025e8f6-452b-407d-b99f-daebe68a4809',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw new Error('http-'+response.status);
      form.hidden=true;var success=document.getElementById('form-success');success.hidden=false;success.focus();
      if(allowed()) {window._hsq=window._hsq||[];window._hsq.push(['identify',{email:String(data.get('email')).trim()}]);window._hsq.push(['setPath','/beleef-uw-verhaal/aanvraag-ontvangen']);window._hsq.push(['trackPageView']);window._hsq.push(['setPath',safePath()]);}
    }catch(error){
      var definite=/^http-/.test(error.message);
      status.textContent=definite?'Uw aanvraag is niet aanvaard. Controleer uw gegevens en probeer opnieuw, of mail hello@executxr.com.':'We konden de ontvangst niet bevestigen. Uw gegevens blijven hier staan. Mail hello@executxr.com als u wilt controleren of de aanvraag aankwam.';
      sending=false;button.disabled=false;button.textContent=definite?'Opnieuw proberen':'Toch opnieuw verzenden';
    }
  });
}());

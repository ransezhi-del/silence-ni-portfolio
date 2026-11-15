(() => {
 let category='all';const grid=document.querySelector('[data-project-grid]');if(!grid)return;
 const E=CMS.escape;
 window.renderProjectCards=()=>{
  const catalog=CMS.data.projects.map((p,index)=>({...p,index})).filter(p=>!p.hidden);
  const selected=grid.dataset.projectGrid==='featured'?catalog.filter(p=>p.featured).slice(0,6):category==='all'?catalog:catalog.filter(p=>p.category===category);
  grid.innerHTML=selected.map(p=>{
   const path=`projects.${p.index}`;
   const visual=p.cover?`<img src="${E(p.cover)}" alt="${E(p.name)}项目画面" loading="lazy" decoding="async" width="1200" height="750" />`:`<div class="type-cover ${p.coverType==='atomform'?'atomform-cover':''}"><span>${E(p.english)}</span><strong>${p.coverType==='atomform'?'M1':E(p.name)}</strong><small>${E(p.subtitle)}</small></div>`;
   const card=`<button class="project-card" data-project="${p.key}" aria-label="查看${E(p.name)}项目详情"><div class="project-art photo-art" data-edit-image="${path}.cover">${visual}<span class="project-open" aria-hidden="true">↗</span></div><div class="project-tags">${p.tags.map((t,i)=>CMS.field(`${path}.tags.${i}`)).join('')}${p.year?CMS.field(`${path}.year`,'span','project-year'):''}</div><div class="project-text"><div>${CMS.field(`${path}.name`,'h3')}${CMS.field(`${path}.subtitle`,'span','project-subtitle')}</div><p data-edit="${path}.summary">${p.summary.map(E).join('<br>')}</p></div></button>`;
   return card;
  }).join('');
  const count=document.querySelector('#archive-count');if(count)count.textContent=`共 ${selected.length} 个项目`;
  document.querySelectorAll('[data-project-total]').forEach(el=>el.textContent=String(catalog.length).padStart(2,'0'));
 };
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('active',el===button);el.setAttribute('aria-pressed',String(el===button));});renderProjectCards();
 }));renderProjectCards();
})();

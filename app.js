const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let paused=reducedMotion.matches;
const motionButton=document.querySelector('#motion-toggle');
function syncMotion(){if(!motionButton)return;document.body.classList.toggle('animation-paused',paused);window.dispatchEvent(new CustomEvent('hero-motion',{detail:{paused}}));motionButton.setAttribute('aria-pressed',String(paused));motionButton.setAttribute('aria-label',paused?'播放人物动画':'暂停人物动画');motionButton.querySelector('.play-icon').textContent=paused?'▶':'Ⅱ';const label=document.querySelector('#motion-label');if(paused)label.textContent='休息一下';else{const path=label.dataset.labelPath||label.querySelector('[data-edit]')?.dataset.edit;if(path){label.dataset.labelPath=path;label.innerHTML=CMS.field(path);}else label.textContent='创意进行中';}}
motionButton?.addEventListener('click',()=>{paused=!paused;syncMotion();});reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;syncMotion();});syncMotion();
const dialogTriggers=new WeakMap();
function openDialog(dialog,trigger){dialogTriggers.set(dialog,trigger);dialog.showModal();document.body.classList.add('modal-open');dialog.scrollTop=0;}
window.openDialog=openDialog;
function wireDialog(dialog){
 dialog.addEventListener('click',event=>{if(event.target.closest('[data-close]'))dialog.close();if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');dialogTriggers.get(dialog)?.focus({preventScroll:true});});
}
window.wireDialog=wireDialog;document.querySelectorAll('dialog').forEach(wireDialog);
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openDialog(document.getElementById(button.dataset.open),button)));
document.querySelector('#experience-work').addEventListener('click',()=>document.querySelector('#experience-dialog').close());
let activeGallery=[],activeImageIndex=0;
function renderProject(){
 const i=CMS.data.projects.findIndex(p=>p.key===CMS.activeProject);if(i<0)return;
 const project=CMS.data.projects[i],path=`projects.${i}`;
 const fields={'detail-title':'title','detail-intro':'brief','detail-approach':'approach','detail-outcome':'outcome','detail-deliverables':'deliverables'};
 for(const [id,key]of Object.entries(fields)){const el=document.getElementById(id);el.textContent=Array.isArray(project[key])?project[key].join(''):project[key];el.dataset.edit=`${path}.${key}`;}
 document.querySelector('#detail-tags').innerHTML=[project.year?CMS.field(`${path}.year`):'',CMS.field(`${path}.role`)].filter(Boolean).join(' / ');
 const slot=document.getElementById('detail-video');
 if(project.video!==slot.dataset.src){
  clearProjectVideo();
  if(project.video){
   const player=document.createElement('video');
   player.controls=true;player.playsInline=true;player.preload='metadata';
   player.setAttribute('aria-label',project.name+' · 项目影片');
   if(project.cover)player.poster=project.cover;
   player.addEventListener('error',()=>{if(!slot.contains(player))return;const msg=document.createElement('p');msg.textContent='当前浏览器无法播放这段视频。';slot.replaceChildren(msg);},{once:true});
   player.src=project.video;slot.append(player);slot.hidden=false;slot.dataset.src=project.video;
  }
 }
 activeGallery=project.images||[];
 const gallery=document.querySelector('#detail-gallery');gallery.innerHTML=activeGallery.map((asset,index)=>`<button class="gallery-shot" data-gallery-index="${index}" data-edit-image="${path}.images.${index}.src" aria-label="放大查看${CMS.escape(project.name)}图片 ${index+1}"><img src="${CMS.escape(asset.src)}" alt="${CMS.escape(asset.alt)}" width="${asset.width}" height="${asset.height}" loading="${index<2?'eager':'lazy'}" decoding="async"><span class="gallery-zoom" aria-hidden="true">↗</span></button>`).join('');gallery.hidden=!activeGallery.length;

}
function clearProjectVideo(){
 const slot=document.getElementById('detail-video'),player=slot.querySelector('video');
 slot.replaceChildren();slot.hidden=true;delete slot.dataset.src;
 if(player){player.pause();player.removeAttribute('src');player.load();}
}
document.getElementById('project-dialog').addEventListener('close',clearProjectVideo);
window.openProject=(key,trigger)=>{CMS.activeProject=key;renderProject();openDialog(document.querySelector('#project-dialog'),trigger);};
document.addEventListener('click',event=>{const button=event.target.closest('[data-project]');if(button)openProject(button.dataset.project,button);});
const imageDialog=document.querySelector('#image-dialog');
function showGalleryImage(index){if(!activeGallery.length)return;activeImageIndex=(index+activeGallery.length)%activeGallery.length;const asset=activeGallery[activeImageIndex],image=document.querySelector('#gallery-full-image');image.src=asset.src;image.alt=asset.alt;document.querySelector('#gallery-image-count').textContent=`${activeImageIndex+1} / ${activeGallery.length}`;imageDialog.querySelectorAll('[data-image-step]').forEach(b=>b.hidden=activeGallery.length<2);}
document.querySelector('#detail-gallery').addEventListener('click',event=>{const button=event.target.closest('[data-gallery-index]');if(!button)return;showGalleryImage(Number(button.dataset.galleryIndex));openDialog(imageDialog,button);});
imageDialog.querySelectorAll('[data-image-step]').forEach(b=>b.addEventListener('click',()=>showGalleryImage(activeImageIndex+Number(b.dataset.imageStep))));imageDialog.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();showGalleryImage(activeImageIndex+(event.key==='ArrowLeft'?-1:1));}});
const tabs=[...document.querySelectorAll('[data-strength]')];
function selectStrength(tab){
 if(!tab)return;const key=tab.dataset.strength,data=CMS.data.strengths[key];tabs.forEach(item=>{item.classList.toggle('active',item===tab);item.setAttribute('aria-selected',String(item===tab));item.tabIndex=item===tab?0:-1;});
 const panel=document.querySelector('#strength-panel');panel.dataset.active=key;panel.setAttribute('aria-labelledby',tab.id);
 for(const [id,field]of [['strength-eyebrow','eyebrow'],['strength-title','title'],['strength-copy','copy']]){const el=document.getElementById(id);el.textContent=data[field];el.dataset.edit=`strengths.${key}.${field}`;}
 panel.querySelectorAll('.visual-note').forEach((note,i)=>{note.textContent=data.notes[i];note.dataset.edit=`strengths.${key}.notes.${i}`;});
}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectStrength(tab));tab.addEventListener('keydown',event=>{let target;if(['ArrowDown','ArrowRight'].includes(event.key))target=tabs[(index+1)%tabs.length];if(['ArrowUp','ArrowLeft'].includes(event.key))target=tabs[(index+tabs.length-1)%tabs.length];if(event.key==='Home')target=tabs[0];if(event.key==='End')target=tabs[tabs.length-1];if(target){event.preventDefault();selectStrength(target);target.focus();}});});
let toastTimer;function showToast(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),4000);}window.showToast=showToast;
window.renderPortfolio=()=>{
 const list=document.querySelector('[data-experience-list]');if(list)list.innerHTML=CMS.data.experience.map((row,i)=>`<article class="experience-item"><span class="experience-dot"></span>${CMS.field(`experience.${i}.0`,'span','small-label')}${CMS.field(`experience.${i}.1`,'h3')}${CMS.field(`experience.${i}.2`,'h4')}${CMS.field(`experience.${i}.3`,'p')}</article>`).join('');
 selectStrength(tabs.find(t=>t.classList.contains('active'))||tabs[0]);
 const profile=CMS.data.profile;
 const email=document.querySelector('#email-contact');if(email){let value=email.querySelector('.contact-value,.contact-pending');value.outerHTML=`<a class="contact-value" href="mailto:${CMS.escape(profile.email)}" data-edit="profile.email">${CMS.escape(profile.email)}</a>`;}
 const wechat=document.querySelector('#wechat-contact');if(wechat){let value=wechat.querySelector('.copy-contact,.contact-pending');value.outerHTML=`<button class="copy-contact" data-edit="profile.wechat" aria-label="复制微信号">${CMS.escape(profile.wechat)} ↗</button>`;wechat.querySelector('button').onclick=async()=>{try{await navigator.clipboard.writeText(CMS.data.profile.wechat);showToast('微信号已复制');}catch{showToast(CMS.data.profile.wechat);}};}
 const phone=document.querySelector('a[href^="tel:"]');if(phone){phone.textContent=profile.phone;phone.href='tel:'+profile.phone.replace(/[^+\d]/g,'');phone.dataset.edit='profile.phone';}
 if(document.querySelector('#project-dialog').open)renderProject();
 const workstation=document.querySelector('.workstation');if(workstation)workstation.dataset.editImage='hero.src';
};renderPortfolio();

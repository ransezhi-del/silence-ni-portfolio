(() => {
 const initial=JSON.parse(document.getElementById('portfolio-data').textContent);
 const get=(path)=>path.split('.').reduce((value,key)=>value?.[key],CMS.data);
 const set=(path,value)=>{const parts=path.split('.');if(parts.some(p=>['__proto__','constructor','prototype'].includes(p)))throw new Error('Invalid field');let target=CMS.data;for(const key of parts.slice(0,-1))target=target[key];target[parts.at(-1)]=value;};
 window.CMS={data:initial,get,set,editing:false,preview:false,dirty:false,activeProject:null,
 escape:value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 field(path,tag='span',className=''){return `<${tag} class="${className}" data-edit="${path}">${this.escape(this.get(path))}</${tag}>`;},
 apply(){
  // Also adapt browser recovery drafts from before the fields were separated.
  this.data.text.t6c31393b9563??='项目命题';this.data.text.t0c8888f90d20??='策略与行动';
  this.data.projects.forEach(p=>{p.brief??=p.summary.join('');});
  document.querySelectorAll('[data-edit^="text."]').forEach(el=>{const value=get(el.dataset.edit);if(value!==undefined)el.textContent=value;});
  const image=document.querySelector('#workstation-image');if(image&&image.src!==new URL(this.data.hero.src,document.baseURI).href){image.src=this.data.hero.src;window.dispatchEvent(new Event('hero-image-change'));}
  document.querySelector('.workstation')?.classList.toggle('custom-hero',!this.data.hero.src.endsWith('assets/hero-workstation-v2.png'));
  document.title=document.body.classList.contains('archive-page')?this.data.meta.archiveTitle:this.data.meta.homeTitle;
  document.querySelector('meta[name="description"]').content=this.data.meta.description;
  window.renderProjectCards?.();window.renderPortfolio?.();
  document.body.classList.toggle('editing',this.editing&&!this.preview);
 },
 change(path,value){set(path,value);this.dirty=true;this.apply();window.updateEditorStatus?.();}
 };
 CMS.apply();
})();

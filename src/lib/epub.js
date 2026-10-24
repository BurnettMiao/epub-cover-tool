import JSZip from 'jszip'
const OPF='http://www.idpf.org/2007/opf';
const nodes=(doc,name)=>Array.from(doc.getElementsByTagNameNS('*',name));
function xml(text){const d=new DOMParser().parseFromString(text,'application/xml');if(nodes(d,'parsererror').length)throw Error('電子書的 XML 格式不完整，無法安全修改。');return d}
function resolve(base,href){const p=base.split('/').slice(0,-1);for(const s of decodeURIComponent(href.split('#')[0]).split('/')){if(s==='..'){if(!p.length)throw Error('EPUB 路徑無效。');p.pop()}else if(s&&s!=='.')p.push(s)}return p.join('/')}
export async function addCover(buffer,image){
 const zip=await JSZip.loadAsync(buffer,{checkCRC32:false});
 let total=0;for(const f of Object.values(zip.files)){total+=f._data?.uncompressedSize||0;if(total>350*1024*1024)throw Error('EPUB 解壓縮後過大，請使用較小的檔案。')}
 if(!zip.file('mimetype')||(await zip.file('mimetype').async('string')).trim()!=='application/epub+zip')throw Error('這不是有效的 EPUB 電子書。');
 const enc=zip.file('META-INF/encryption.xml');if(enc){const d=xml(await enc.async('string'));if(nodes(d,'EncryptionMethod').some(n=>!['http://www.idpf.org/2008/embedding','http://ns.adobe.com/pdf/enc#RC'].includes(n.getAttribute('Algorithm'))))throw Error('此 EPUB 含有不支援的加密內容，可能受到 DRM 保護。')}
 const container=zip.file('META-INF/container.xml');if(!container)throw Error('找不到 EPUB 的目錄資訊。');
 const roots=nodes(xml(await container.async('string')),'rootfile');if(roots.length!==1)throw Error('目前只支援單一書籍版本的 EPUB。');
 const opfPath=roots[0].getAttribute('full-path'),opfFile=zip.file(opfPath);if(!opfFile)throw Error('找不到 EPUB 的書籍資訊。');
 const doc=xml(await opfFile.async('string')),pkg=doc.documentElement,manifest=nodes(doc,'manifest')[0],spine=nodes(doc,'spine')[0],metadata=nodes(doc,'metadata')[0];if(!manifest||!spine||!metadata)throw Error('EPUB 缺少必要的書籍結構。');
 const items=nodes(manifest,'item'),oldImageIds=new Set(nodes(metadata,'meta').filter(n=>n.getAttribute('name')==='cover').map(n=>n.getAttribute('content'))),oldPages=new Set();
 for(const item of items){let props=(item.getAttribute('properties')||'').split(/\s+/).filter(Boolean);if(props.includes('cover-image'))oldImageIds.add(item.getAttribute('id'));props=props.filter(p=>p!=='cover-image');if(props.length)item.setAttribute('properties',props.join(' '));else item.removeAttribute('properties')}
 const guide=nodes(doc,'guide')[0];if(guide)for(const ref of nodes(guide,'reference'))if(ref.getAttribute('type')==='cover'){oldPages.add(resolve(opfPath,ref.getAttribute('href')));ref.remove()}
 // Detect legacy cover pages that contain only the old cover image, never chapter text.
 for(const ref of nodes(spine,'itemref')){const item=items.find(n=>n.getAttribute('id')===ref.getAttribute('idref'));if(!item||item.getAttribute('media-type')!=='application/xhtml+xml')continue;const path=resolve(opfPath,item.getAttribute('href'));if(!oldPages.has(path)){const f=zip.file(path);if(f){const d=xml(await f.async('string')),body=nodes(d,'body')[0],imgs=[...nodes(d,'img'),...nodes(d,'image')];if(body&&!body.textContent.trim()&&imgs.length===1){const src=imgs[0].getAttribute('src')||imgs[0].getAttribute('href')||imgs[0].getAttributeNS('http://www.w3.org/1999/xlink','href');if(src&&items.some(n=>oldImageIds.has(n.getAttribute('id'))&&resolve(opfPath,n.getAttribute('href'))===resolve(path,src)))oldPages.add(path)}}}if(oldPages.has(path))ref.remove()}
 for(const n of nodes(metadata,'meta'))if(n.getAttribute('name')==='cover')n.remove();
 const ids=new Set(Array.from(doc.querySelectorAll('[id]')).map(n=>n.getAttribute('id')));const uid=base=>{let id=base,i=1;while(ids.has(id))id=base+'-'+i++;ids.add(id);return id};
 const imageId=uid('bookstudio-cover-image'),pageId=uid('bookstudio-cover-page');let folder='bookstudio-cover',i=1;const base=opfPath.includes('/')?opfPath.slice(0,opfPath.lastIndexOf('/')+1):'';while(Object.keys(zip.files).some(n=>n.startsWith(base+folder+'/')))folder='bookstudio-cover-'+i++;
 const ext=image.mime==='image/png'?'png':'jpg',imageHref=folder+'/cover.'+ext,pageHref=folder+'/cover.xhtml';
 const el=(name,attrs)=>{const n=doc.createElementNS(pkg.namespaceURI||OPF,name);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n};
 const imageAttrs={id:imageId,href:imageHref,'media-type':image.mime};if(parseFloat(pkg.getAttribute('version'))>=3)imageAttrs.properties='cover-image';
 manifest.append(el('item',imageAttrs),el('item',{id:pageId,href:pageHref,'media-type':'application/xhtml+xml'}));
 metadata.append(el('meta',{name:'cover',content:imageId}));spine.insertBefore(el('itemref',{idref:pageId,linear:'yes'}),spine.firstChild);
 let g=guide;if(!g){g=el('guide',{});pkg.append(g)}g.append(el('reference',{type:'cover',title:'Cover',href:pageHref}));
 for(const m of nodes(metadata,'meta'))if(m.getAttribute('property')==='dcterms:modified')m.textContent=new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
 zip.file(base+imageHref,await image.file.arrayBuffer());
 zip.file(base+pageHref,'<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Cover</title><meta name="viewport" content="width='+image.width+', height='+image.height+'"/><style>html,body{margin:0;padding:0;height:100%;text-align:center}img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body><img src="cover.'+ext+'" alt="Cover"/></body></html>');
 zip.file(opfPath,new XMLSerializer().serializeToString(doc));
 // EPUB requires mimetype to be the first entry and stored without compression.
 const out=new JSZip();out.file('mimetype','application/epub+zip',{compression:'STORE'});for(const [path,f]of Object.entries(zip.files)){if(path==='mimetype'||f.dir)continue;out.file(path,await f.async('uint8array'),{compression:'DEFLATE'})}
 return out.generateAsync({type:'blob',mimeType:'application/epub+zip',compression:'DEFLATE',compressionOptions:{level:6}})
}

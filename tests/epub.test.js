import { test } from 'node:test'
import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { JSDOM } from 'jsdom'
import { addCover } from '../src/lib/epub.js'
const dom = new JSDOM('')
globalThis.DOMParser = dom.window.DOMParser
globalThis.XMLSerializer = dom.window.XMLSerializer
const parse = s => new DOMParser().parseFromString(s, 'application/xml')
const all = (d, n) => [...d.getElementsByTagNameNS('*', n)]
const image = { mime: 'image/png', width: 600, height: 900, file: new Blob([new Uint8Array([137,80,78,71,13,10,26,10])]) }
async function fixture(version = '3.0', legacy = false, encryption = '') {
  const z = new JSZip()
  z.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  z.file('META-INF/container.xml', '<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OPS/package.opf"/></rootfiles></container>')
  z.file('OPS/package.opf', `<package xmlns="http://www.idpf.org/2007/opf" version="${version}"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Book</dc:title>${legacy ? '<meta name="cover" content="oldimg"/>' : ''}</metadata><manifest><item id="ch" href="chapter.xhtml" media-type="application/xhtml+xml"/>${legacy ? '<item id="oldimg" href="old.png" media-type="image/png"/><item id="oldpage" href="old.xhtml" media-type="application/xhtml+xml"/>' : ''}</manifest><spine>${legacy ? '<itemref idref="oldpage"/>' : ''}<itemref idref="ch"/></spine>${legacy ? '<guide><reference type="cover" href="old.xhtml"/></guide>' : ''}</package>`)
  z.file('OPS/chapter.xhtml', '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter</title></head><body><h1>Keep me</h1></body></html>')
  if (legacy) { z.file('OPS/old.xhtml','<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Cover</title></head><body><img src="old.png" alt="Cover"/></body></html>'); z.file('OPS/old.png', 'old image') }
  if (encryption) z.file('META-INF/encryption.xml', `<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><EncryptionMethod Algorithm="${encryption}"/></encryption>`)
  return z.generateAsync({type: 'arraybuffer'})
}
for (const version of ['2.0', '3.0']) test(`EPUB ${version}: preserves content, inserts valid cover and permits replacement`, async () => {
  const source = await fixture(version)
  const original = await JSZip.loadAsync(source)
  let blob = await addCover(source, image)
  for (let round = 0; round < 2; round++) {
    const bytes = new Uint8Array(await blob.arrayBuffer())
    assert.equal(new TextDecoder().decode(bytes.slice(30, 38)), 'mimetype')
    assert.equal(bytes[8], 0)
    const z = await JSZip.loadAsync(bytes, {checkCRC32:true})
    assert.equal(await z.file('OPS/chapter.xhtml').async('string'), await original.file('OPS/chapter.xhtml').async('string'))
    const d = parse(await z.file('OPS/package.opf').async('string'))
    assert.equal(all(d,'parsererror').length,0)
    const items = all(d,'item'), refs = all(d,'itemref')
    assert.equal(refs.length,2)
    assert.equal(refs[1].getAttribute('idref'),'ch')
    const coverMeta=all(d,'meta').filter(n=>n.getAttribute('name')==='cover')
    assert.equal(coverMeta.length,1)
    const imageItem=items.find(n=>n.getAttribute('id')===coverMeta[0].getAttribute('content'))
    assert.equal(imageItem.getAttribute('media-type'),'image/png')
    assert.equal(items.filter(n=>n.getAttribute('properties')==='cover-image').length,version==='3.0'?1:0)
    const page=items.find(n=>n.getAttribute('id')===refs[0].getAttribute('idref'))
    assert.ok(z.file('OPS/'+page.getAttribute('href')))
    const ids=items.map(n=>n.getAttribute('id'))
    assert.equal(new Set(ids).size,ids.length)
    if(round===0) blob=await addCover(bytes,image)
  }
})
test('replaces a legacy cover without removing the chapter', async()=>{
  const z=await JSZip.loadAsync(await (await addCover(await fixture('2.0',true),image)).arrayBuffer())
  const d=parse(await z.file('OPS/package.opf').async('string'))
  assert.equal(all(d,'itemref').length,2)
  assert.ok(!all(d,'itemref').some(n=>n.getAttribute('idref')==='oldpage'))
  assert.ok(z.file('OPS/old.png'))
})
test('rejects DRM but retains permitted font obfuscation',async()=>{
  await assert.rejects(addCover(await fixture('3.0',false,'http://www.w3.org/2001/04/xmlenc#aes128-cbc'),image),/DRM/)
  await addCover(await fixture('3.0',false,'http://www.idpf.org/2008/embedding'),image)
})
test('rejects invalid EPUB structures',async()=>{
  const z=new JSZip();z.file('hello','world')
  await assert.rejects(addCover(await z.generateAsync({type:'arraybuffer'}),image),/有效/)
})

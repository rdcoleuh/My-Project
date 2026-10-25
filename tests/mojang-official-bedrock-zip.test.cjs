/* Official Bedrock Samples-compatible ZIP layout, using generated dummy bytes.
 * No copyrighted asset bytes or downloads are shipped in this test.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
function zip(files) {
 const local=[],central=[];let offset=0;
 for(const [name,data] of files){
   const n=Buffer.from(name),bytes=Buffer.from(data);
   const head=Buffer.alloc(30+n.length),dir=Buffer.alloc(46+n.length);
   head.writeUInt32LE(0x04034b50,0);
   head.writeUInt16LE(20,4);head.writeUInt32LE(bytes.length,18);
   head.writeUInt32LE(bytes.length,22);head.writeUInt16LE(n.length,26);n.copy(head,30);
   dir.writeUInt32LE(0x02014b50,0);
   dir.writeUInt16LE(20,4);dir.writeUInt16LE(20,6);
   dir.writeUInt32LE(bytes.length,20);dir.writeUInt32LE(bytes.length,24);
   dir.writeUInt16LE(n.length,28);dir.writeUInt32LE(offset,42);n.copy(dir,46);
   local.push(head,bytes);central.push(dir);offset+=head.length+bytes.length;
 }
 const footer=Buffer.alloc(22);
 footer.writeUInt32LE(0x06054b50,0);
 footer.writeUInt16LE(files.length,8);footer.writeUInt16LE(files.length,10);
 footer.writeUInt32LE(central.reduce((n,v)=>n+v.length,0),12);
 footer.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,footer])).buffer;
}
function reader(){
 const code=read('local-resource-pack.js').match(/function readArchive\(buffer\)\{[\s\S]*?(?=\nfunction imageFromPng)/)?.[0];
 assert.ok(code);
 return vm.runInNewContext(code+'\nreadArchive',{ArrayBuffer,DataView,Uint8Array,TextDecoder,
   Blob,DecompressionStream,Math,Error});
}
test('Mojang full-release resource_pack layouts work with no repacking',async()=>{
 const archive=reader()(zip([
  ['README.md',Buffer.from('documentation')],
  ['resource_pack/textures/blocks/stone.png',Buffer.from([2])],
  ['resource_pack/textures/blocks/deepslate/deepslate_diamond_ore.png',Buffer.from([3])],
  ['resource_pack/textures/items/iron_sword.png',Buffer.from([4])],
  ['resource_pack/textures/blocks/crafting_table_top.png',Buffer.from([5])],
  ['resource_pack/sounds/random/click.ogg',Buffer.from([6])],
  ['resource_pack/textures/blocks/stone.png.mcmeta',Buffer.from([7])],
  ['behavior_pack/entities/cow.json',Buffer.from('{}')],
  ['assets/somemod/textures/block/stone.png',Buffer.from([9])]
 ]));
 assert.ok(archive.entries.has('stone'));
 assert.ok(archive.entries.has('deepslate_diamond_ore'));
 assert.ok(archive.entries.has('crafting_table_top'));
 assert.ok(archive.entries.has('item:iron_sword'));
 assert.ok(archive.entries.has('meta:stone'));
 assert.ok(archive.entries.has('sound:random/click'));
 assert.equal(archive.entries.has('cow'),false);
 assert.deepEqual([...await archive.get('stone')],[2]);
 assert.deepEqual([...await archive.get('item:iron_sword')],[4]);
});
test('vanilla Mojang release sprites outrank loose root duplicates in either file order',async()=>{
 for(const reverse of [false,true]){
  const entries=[
    ['textures/blocks/stone.png',Buffer.from([1])],
    ['resource_pack/textures/blocks/stone.png',Buffer.from([2])],
    ['assets/minecraft/textures/block/stone.png',Buffer.from([3])],
    ['resource_pack/textures/blocks/deepslate/stone.png',Buffer.from([4])],
    ['assets/modid/textures/blocks/stone.png',Buffer.from([9])]
  ];
  const archive=reader()(zip(reverse?entries.reverse():entries));
  assert.deepEqual([...await archive.get('stone')],[3],'the vanilla namespace has highest priority');
 }
});
test('full-size released Bedrock ZIP is within 240 MiB cap, and stored only with opt-in',()=>{
 const importer=read('local-resource-pack.js'),storage=read('local-pack-storage.js');
 assert.match(importer,/buffer\.byteLength>240\*1024\*1024/);
 assert.match(storage,/const LIMIT=240\*1024\*1024/);
 assert.match(importer,/remember\.checked\?await packStorage\?\.save\?\.\(selected\):false/);
 assert.match(importer,/\.zip,\.jar,\.mcpack/);
 assert.ok(!importer.includes('fetch('),'vanilla textures must be chosen by the player');
});

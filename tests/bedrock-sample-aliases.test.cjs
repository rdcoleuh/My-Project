/* Mojang Bedrock Samples filename compatibility tests.
 * Fixtures contain filenames only, never any original texture bytes.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','local-resource-pack.js'),'utf8');
function mappings(){
 const from=source.indexOf('const mappings=new Map();');
 const to=source.indexOf('function readArchive(buffer)');
 assert.ok(from>=0&&to>from,'resource-pack mapping declarations exist');
 return vm.runInNewContext(source.slice(from,to)+
  '\n({aliases,mappings,textureName,bedrockSampleAliases})',
  {window:{MineWorldBlockGuide:{names:[]}}});
}
// Names verified in the Mojang/bedrock-samples resource_pack/textures/blocks tree.
// Each expected key is a sprite that the official ZIP can actually supply.
const fixtures=[
 ['oak_leaves','leaves_oak_opaque',6,0],
 ['spruce_leaves','leaves_spruce_opaque',31,0],
 ['birch_leaves','leaves_birch_opaque',33,0],
 ['acacia_leaves','leaves_acacia_opaque',35,0],
 ['jungle_leaves','leaves_jungle_opaque',37,0],
 ['mangrove_leaves','mangrove_leaves_opaque',39,0],
 ['pale_oak_leaves','pale_oak_leaves_opaque',43,0],
 ['rose_bush_top','double_plant_rose_top',16,0],
 ['grass_block_side','grass_side_carried',1,1],
 ['bamboo_stalk','bamboo_stem',45,0],
 ['pointed_dripstone','pointed_dripstone_down_tip',63,0],
 ['crimson_nylium','crimson_nylium_top',75,0],
 ['warped_nylium','warped_nylium_top',76,0],
 ['crimson_stem','crimson_log_side',78,1],
 ['crimson_stem_top','crimson_log_top',78,0],
 ['twisting_vines','twisting_vines_base',93,0],
 ['end_portal_frame_side','endframe_side',125,1],
 ['end_portal_frame_top','endframe_top',125,0],
 ['shulker_box','shulker_top_undyed',133,0],
 ['fletching_table_front','fletcher_table_side1',161,1],
 ['fletching_table_top','fletcher_table_top',161,0],
 ['red_bed_top','bed_head_top',169,0],
 ['red_bed_side','bed_head_side',169,1],
 ['red_bed_bottom','bed_head_end',169,2]
];
test('24 real Bedrock filename variants map to their intended block faces',()=>{
 const {aliases,textureName,bedrockSampleAliases}=mappings();
 assert.equal(fixtures.length,24);
 assert.equal(Object.keys(bedrockSampleAliases).length,24);
 for(const [key,sprite,id,face] of fixtures){
  assert.equal(textureName(id,face),key,'block '+id+' face '+face);
  assert.ok(aliases[key].includes(sprite),'Missing Bedrock sprite '+sprite+' for '+key);
 }
});
test('existing Java canonical and older Bedrock aliases remain preferred',()=>{
 const {aliases}=mappings();
 assert.equal(['grass_block_side',...aliases.grass_block_side][0],'grass_block_side');
 assert.ok(aliases.grass_block_side.indexOf('grass_side')<
   aliases.grass_block_side.indexOf('grass_side_carried'));
 assert.ok(aliases.oak_leaves.indexOf('leaves_oak')<
   aliases.oak_leaves.indexOf('leaves_oak_opaque'));
});
test('new Bedrock mapping does not embed or fetch any copyrighted bitmap',()=>{
 assert.doesNotMatch(source,/fetch\s*\(/);
 assert.match(source,/const bedrockSampleAliases=\{/);
 assert.match(source,/No Minecraft bitmaps or third-party assets are bundled/);
});

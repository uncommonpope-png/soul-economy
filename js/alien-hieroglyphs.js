/* js/alien-hieroglyphs.js — procedural alien rune engine (classic script, shared singleton).
   Runes are generated vector strokes stamped into silicon, not clipart.
   Exposes window.AlienHieroglyphs. No dependencies. */
(function(){
'use strict';
var COUNT=48;

function generateAlienAlphabet(count){
  var glyphs=[];
  for(var i=0;i<count;i++){
    var strokes=[];
    var numStrokes=3+(i%4);
    for(var s=0;s<numStrokes;s++){
      strokes.push({
        x1:4+(Math.sin(i*9+s*3)*0.5+0.5)*24,
        y1:4+(Math.cos(i*7+s*5)*0.5+0.5)*24,
        cx:16+Math.sin(s*1.5)*12,
        cy:16+Math.cos(s*1.5)*12,
        x2:4+(Math.cos(i*3+s)*0.5+0.5)*24,
        y2:4+(Math.sin(i*5+s)*0.5+0.5)*24,
        isArc:(s%2===0)
      });
    }
    glyphs.push(strokes);
  }
  return glyphs;
}

var dict=generateAlienAlphabet(COUNT);

function drawGlyph(ctx,index,x,y,size,color,alpha){
  var glyph=dict[((index%COUNT)+COUNT)%COUNT];
  ctx.save();
  ctx.translate(x,y);
  var scale=size/32;
  ctx.scale(scale,scale);
  ctx.strokeStyle=color;
  ctx.lineWidth=2.2/scale;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.globalAlpha=(alpha==null?1:alpha);
  ctx.shadowColor=color;
  ctx.shadowBlur=8;
  for(var i=0;i<glyph.length;i++){
    var st=glyph[i];
    ctx.beginPath();
    ctx.moveTo(st.x1,st.y1);
    if(st.isArc) ctx.quadraticCurveTo(st.cx,st.cy,st.x2,st.y2);
    else ctx.lineTo(st.x2,st.y2);
    ctx.stroke();
  }
  ctx.fillStyle='#ffffff';
  ctx.beginPath();
  ctx.arc(16,16,1.6/scale,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

window.AlienHieroglyphs={count:COUNT,draw:drawGlyph};
})();

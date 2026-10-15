/* ClimaIQ - Motor de búsqueda diferencial local. Sin dependencias ni servicios remotos. */
(function(){
'use strict';
const stop=new Set('el la los las de del por con que para en es se un una unos unas no si y o pero mi su al lo muy tiene tengo esta este desde hacia como cuando equipo aire acondicionado refrigeracion revisar falla fallas problema problemas sistema'.split(' '));
const groups={
  'enciende':'arranca prende alimentacion apagado', 'prende':'enciende arranca alimentacion apagado',
  'arranca':'enciende prende compresor motor contacto', 'arranque':'arranca inrush contactor compresor',
  'enfria':'frio refrigeracion capacidad consigna rendimiento temperatura enfriamiento',
  'enfriar':'frio capacidad consigna rendimiento temperatura',
  'frio':'enfria capacidad rendimiento evaporador',
  'hielo':'congela congelado escarcha evaporador caudal',
  'congela':'hielo escarcha evaporador caudal',
  'zumba':'compresor arranca rotor capacitor rele',
  'salta':'dispara termomagnetico diferencial proteccion',
  'breaker':'dispara interruptor termomagnetico proteccion',
  'gotea':'agua drenaje bandeja condensado',
  'agua':'gotea drenaje bomba condensado',
  'calienta':'temperatura sobrecalienta termico',
  'ruido':'vibra vibracion rodamiento compresor motor',
  'inverter':'electronica placa sensor comunicacion modulo',
  'codigo':'error alarma sensor comunicacion placa',
  'fuga':'refrigerante detector estanqueidad',
  'presion':'alta baja descarga succion refrigerante',
  'caudal':'bomba filtro valvula flujo',
  'electricidad':'tension alimentacion corriente motor',
  'ventilador':'turbina aspas motor velocidad giro',
  'consumo':'amperios corriente compresor energetica',
};
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function words(s){return norm(s).split(' ').filter(x=>x.length>2&&!stop.has(x));}
function expand(tokens){let t=new Set(tokens);for(const x of tokens){for(const y of (groups[x]||'').split(' ')){if(y)t.add(y);}}return [...t];}
function normalizedMatch(t,doc){return doc.includes(t)||t.length>5&&doc.includes(t.slice(0,-2));}
const equipCategory={
 'Split convencional':['ALIMENTACIÓN','CAPACITORES','COMPRESORES','EVAPORADOR','CONDENSADOR','REFRIGERANTE','DRENAJE'],
 'Split inverter':['INVERTER','EVAPORADOR','CONDENSADOR','REFRIGERANTE','DRENAJE','COMPRESORES'],
 'VRF / VRV':['INVERTER','REFRIGERANTE','CONDENSADOR','COMPRESORES'],
 'Chiller':['CHILLERS','REFRIGERANTE','CONDENSADOR','COMPRESORES'],
 'Cámara frigorífica':['REFRIGERACIÓN COMERCIAL','REFRIGERANTE','COMPRESORES','CONDENSADOR'],
 'Refrigeración comercial':['REFRIGERACIÓN COMERCIAL','REFRIGERANTE','COMPRESORES'],
 'Motor / bomba':['CHILLERS','CAPACITORES','ALIMENTACIÓN','COMPRESORES']
};
function score(card,terms,equipment,original){
 const title=norm(card.title), symptom=norm(card.symptom), causes=norm(card.causes.join(' '));
 let points=0,matched=0;
 for(const word of terms){
   let p=0;
   if(normalizedMatch(word,title))p+=6.2;
   if(normalizedMatch(word,symptom))p+=4.2;
   if(normalizedMatch(word,causes))p+=2.2;
   if(p){points+=p;matched++;}
 }
 if(original&&title.includes(norm(original)))points+=12;
 const categories=equipCategory[equipment]||[];
 if(categories.some(c=>card.category.includes(c)))points+=1.8;
 if(terms.length>1&&matched>1)points+=2.0*matched/terms.length;
 return {score:points,matched};
}
function rank(cards,{text='',selected=[],equipment='',measurements={}}){
 const originals=[text,...selected].join(' ');
 const termList=expand(words(originals));
 if(!termList.length)return [];
 let ranked=cards.map(c=>({...score(c,termList,equipment,originals),card:c})).filter(x=>x.score>1).sort((a,b)=>b.score-a.score||a.card.id-b.card.id).slice(0,6);
 // Orden relativo de coincidencia, no probabilidad estadística ni diagnóstico confirmado.
 const max=ranked[0]?.score||1;
 return ranked.map(r=>({...r,level:r.score>max*.72?'alta':r.score>max*.40?'media':'orientativa'}));
}
function evaluateMeasurements(m){
 const alerts=[]; const num=(x)=>Number(x);
 if(num(m.voltage)>0&&num(m.nominalVoltage)>0){
 const deviation=(num(m.voltage)/num(m.nominalVoltage)-1)*100;
 if(Math.abs(deviation)>=8)alerts.push(`Tensión medida ${m.voltage} V frente a ${m.nominalVoltage} V de placa (${deviation>0?'+':''}${deviation.toFixed(1)} %). Verifica el rango admisible OEM antes de sacar conclusiones.`);
 }
 if(num(m.current)>0&&num(m.nominalCurrent)>0){
 const rel=num(m.current)/num(m.nominalCurrent);
 if(rel>1.05) alerts.push(`Corriente ${m.current} A superior a la corriente nominal registrada (${m.nominalCurrent} A). Confirma si la placa corresponde a RLA/FLA y contrasta con las condiciones reales.`);
 }
 if(num(m.cap)>0&&num(m.nominalCap)>0){
 const delta=(num(m.cap)/num(m.nominalCap)-1)*100;
 if(Math.abs(delta)>5)alerts.push(`Capacitor: ${m.cap} µF frente a ${m.nominalCap} µF (variación ${delta.toFixed(1)} %). Verifica la tolerancia impresa antes de decidir reemplazo.`);
 }
 if(m.refrigerant==='R290'||m.refrigerant==='R600a')alerts.push('Refrigerante altamente inflamable (A3): evaluar ventilación, equipo adecuado, detección y control de fuentes de ignición. Intervención solo por personal habilitado.');
 if(m.refrigerant==='R32')alerts.push('Refrigerante A2L: verificar procedimientos para refrigerante ligeramente inflamable y herramientas compatibles.');
 return alerts;
}
window.HVACEngine={norm,words,rank,evaluateMeasurements};
})();

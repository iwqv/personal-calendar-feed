import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const c = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
const year = c.year;
if (year !== 2026) throw new Error('此数据包仅核实 2026 年，请先更新节假日和节气数据。');
const out = path.join(root, 'output'); fs.mkdirSync(out, {recursive:true});
const parse = s => new Date(`${s}T12:00:00Z`);
const iso = d => d.toISOString().slice(0,10);
const shift = (s,n) => {const d=parse(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)};
const compact = s => s.replaceAll('-','');
const events = {holiday:[],festival:[],almanac:[]};
const lunarFmt = new Intl.DateTimeFormat('en-u-ca-chinese',{month:'numeric',day:'numeric',timeZone:'Asia/Shanghai'});
const lunar = new Map();
for(let d=`${year}-01-01`;d<=`${year}-12-31`;d=shift(d,1)) {
  const parts=lunarFmt.formatToParts(parse(d));
  const m=parts.find(x=>x.type==='month').value, day=Number(parts.find(x=>x.type==='day').value);
  if (!m.endsWith('bis')) lunar.set(`${Number(m)}-${day}`,d);
}
const add=(key,title,start,end,description='',time=null,id=null)=> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || iso(parse(start))!==start) throw new Error(`无效日期: ${start}`);
  events[key].push({title,start,end:end||shift(start,1),description,time,id:id||`${key}-${start}-${title}`});
};
for(const h of c.holidays) {
  const days=Math.round((parse(h.end)-parse(h.start))/86400000)+1;
  for(let i=0;i<days;i++) {
    const d=shift(h.start,i);
    add('holiday',`🏖 ${h.name}假期 第${i+1}天/共${days}天`,d,null,
      `${h.name}：${h.start} 至 ${h.end}，共 ${days} 天。${h.highway_free?'7座及以下小型客车按国家政策免收通行费。':''}来源：国务院办公厅2026年部分节假日安排。`);
  }
  if(h.highway_free) add('holiday',`🚙 ${h.name}高速免费`,h.start,shift(h.end,1),
    `仅符合政策的小型客车；以驶离高速出口收费车道时间为准。具体以交通主管部门最新公告为准。`);
  for(const w of h.workdays) {
    add('holiday',`💼 ${h.name}调休上班`,w);
    if(c.holiday_reminder_day_before) add('holiday',`⏰ 明天补班：${h.name}`,shift(w,-1),null,
      `明天 ${w} 为调休工作日。`,`${c.holiday_reminder_hour}:00`);
  }
  if(c.rail_reminders) {
    const presale=shift(h.start,-(c.rail_presale_days_including_departure-1));
    add('holiday',`🎫 ${h.name}首日火车票开售参考`,presale,null,
      `计划乘坐 ${h.start} 车次。以12306公布的起售时间和当前预售期为准，建议提前核对车站及具体车次。`,`${c.holiday_reminder_hour}:00`);
  }
}
for(const [md,title] of c.fixed_events) add('festival',title,`${year}-${md}`);
for(const [m,day,title] of c.lunar_events) {
  const d=lunar.get(`${m}-${day}`);
  if(!d) throw new Error(`找不到农历日期：${m}-${day}`);
  add('festival',title,d);
}
// 节气数据：日期由香港天文台 2026 节气表核对；记录北京时间的日期，不用于推算精确交节时刻。
const terms=[
  ['01-05','小寒'],['01-20','大寒'],['02-04','立春'],['02-18','雨水'],
  ['03-05','惊蛰'],['03-20','春分'],['04-05','清明'],['04-20','谷雨'],
  ['05-05','立夏'],['05-21','小满'],['06-05','芒种'],['06-21','夏至'],
  ['07-07','小暑'],['07-23','大暑'],['08-07','立秋'],['08-23','处暑'],
  ['09-07','白露'],['09-23','秋分'],['10-08','寒露'],['10-23','霜降'],
  ['11-07','立冬'],['11-22','小雪'],['12-07','大雪'],['12-22','冬至']
];
for(const [md,title] of terms) add('festival',`🌿 ${title}`,`${year}-${md}`);
const nthSunday=(month,n)=>{const first=new Date(Date.UTC(year,month-1,1)).getUTCDay();return `${year}-${String(month).padStart(2,'0')}-${String(1+(7-first)%7+7*(n-1)).padStart(2,'0')}`};
add('festival','母亲节',nthSunday(5,2)); add('festival','父亲节',nthSunday(6,3));
if(c.gift_reminders) for(const r of c.gift_rules) {
  const target=r.date||(lunar.get(r.lunar.join('-')));
  if(!target) throw new Error(`礼物规则缺少日期：${r.name}`);
  add('festival',`🎁 准备${r.name}礼物`,shift(target,-r.days_before),null,
    `${r.name} 是 ${target}。这是提前 ${r.days_before} 天的准备提醒。`,`${c.reminder_hour}:00`);
}
for(const p of c.personal_events) add('festival',p.title,p.date,null,p.description||'',p.time||null);
const file=path.join(root,c.almanac_csv);
if(c.daily_almanac && fs.existsSync(file)) {
  const rows=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1);
  for(const [i,line] of rows.entries()) {
    if(!line.trim()) continue;
    const cols=line.split(',');
    if(cols.length!==4) throw new Error(`黄历 CSV 第 ${i+2} 行格式错误；字段不得含逗号`);
    const [date,yi,ji,source]=cols.map(x=>x.trim());
    if (!source) throw new Error(`黄历 CSV 第 ${i+2} 行缺少来源`);
    if(date.startsWith(`${year}-`)) add('almanac','💡 今日宜忌',date,null,`宜：${yi||'未提供'}\n忌：${ji||'未提供'}\n参考来源：${source}\n传统民俗信息，仅供参考。`);
  }
}
const escape=s=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
const fold=s=>{let lines=[],part='',bytes=0;for(const char of s){let n=Buffer.byteLength(char);if(bytes+n>75){lines.push(part);part=' '+char;bytes=1+n}else{part+=char;bytes+=n}}lines.push(part);return lines.join('\r\n')};
const write=(key,name)=> {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Personal Calendar Replica//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${escape(name)}`,'X-WR-TIMEZONE:Asia/Shanghai','REFRESH-INTERVAL;VALUE=DURATION:PT12H'];
  let seen=new Set();
  for(const e of events[key].sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title))) {
    const uid=`${Buffer.from(e.id).toString('hex').slice(0,96)}@personal-calendar.example`;
    if(seen.has(uid)) continue; seen.add(uid);
    lines.push('BEGIN:VEVENT',`UID:${uid}`,'DTSTAMP:20260918T000000Z',`SUMMARY:${escape(e.title)}`);
    if(e.time){
      const [hh,mm]=e.time.split(':').map(Number);
      const start=new Date(`${e.start}T00:00:00Z`);start.setUTCHours(hh-8,mm);
      const end=new Date(start.getTime()+30*60000);
      const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
      lines.push(`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,'BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${escape(e.title)}`,'TRIGGER:-PT0M','END:VALARM');
    } else lines.push(`DTSTART;VALUE=DATE:${compact(e.start)}`,`DTEND;VALUE=DATE:${compact(e.end)}`);
    if(e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  fs.writeFileSync(path.join(out,`${key}.ics`),lines.map(fold).join('\r\n')+'\r\n');
  return {calendar:name,events:seen.size};
};
console.log(JSON.stringify([write('holiday','2026 中国节假日调休'),write('festival','2026 活动纪念日'),write('almanac','2026 老黄历')],null,2));
const pages = path.join(root,'docs');
fs.mkdirSync(pages,{recursive:true});
for(const filename of ['holiday.ics','festival.ics']) {
  fs.copyFileSync(path.join(out,filename),path.join(pages,filename));
}

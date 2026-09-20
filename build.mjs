import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import lunarJavascript from 'lunar-javascript';

const {Solar} = lunarJavascript;

const root = path.dirname(fileURLToPath(import.meta.url));
const c = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
const year = c.year;
if (year !== 2026) throw new Error('此数据包仅核实 2026 年，请先更新节假日和节气数据。');
const out = path.join(root, 'output'); fs.mkdirSync(out, {recursive:true});
const parse = s => new Date(`${s}T12:00:00Z`);
const iso = d => d.toISOString().slice(0,10);
const shift = (s,n) => {const d=parse(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)};
const compact = s => s.replaceAll('-','');
const weekday = s => '日一二三四五六'[parse(s).getUTCDay()];
const lunarFor = s => {
  const [y,m,d]=s.split('-').map(Number);
  return Solar.fromYmd(y,m,d).getLunar();
};
const dateLabel = s => {
  const [,m,d]=s.split('-').map(Number);
  const l=lunarFor(s);
  return `${m}月${d}日（周${weekday(s)}，农历${l.getMonthInChinese()}月${l.getDayInChinese()}）`;
};
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
  const holidayNote=[
    `📝 ${h.name}：${dateLabel(h.start)}至${dateLabel(h.end)}放假调休，共${days}天。`,
    h.workdays.length?`💼 ${h.workdays.map(dateLabel).join('、')}上班。`:'',
    h.highway_free?'🚙 假期高速通行政策请以交通运输部门公告为准。':'',
    '依据：国务院办公厅2026年部分节假日安排。'
  ].filter(Boolean).join('\n');
  for(let i=0;i<days;i++) {
    const d=shift(h.start,i);
    add('holiday',`🌴 ${h.name}放假 第${i+1}天/共${days}天`,d,null,holidayNote,null,
      `holiday-${d}-🏖 ${h.name}假期 第${i+1}天/共${days}天`);
  }
  if(h.highway_free) add('holiday',`🚙 ${h.name}高速免费`,h.start,shift(h.end,1),
    `🚙 ${h.name}假期高速免费通行。适用车型、免费时间及实际政策，请以交通运输部门公告为准。`);
  for(const w of h.workdays) {
    add('holiday',`💼 ${h.name}调休上班`,w,null,`📝 ${dateLabel(w)}为调休工作日，记得按工作日安排。\n依据：国务院办公厅2026年部分节假日安排。`);
    if(c.holiday_reminder_day_before) add('holiday',`⏰ 记得定明早闹钟！`,shift(w,-1),null,
      `明天是${h.name}调休上班日：${dateLabel(w)}。别忘了设好闹钟。`,`${c.holiday_reminder_hour}:00`,
      `holiday-${shift(w,-1)}-⏰ 明天补班：${h.name}`);
  }
  if(c.rail_reminders) {
    const presale=shift(h.start,-(c.rail_presale_days_including_departure-1));
    const reminderDate=shift(presale,-1);
    add('holiday',`🚄 明天留意${h.name}去程车票！`,reminderDate,null,
      `🚄 按含乘车当日 ${c.rail_presale_days_including_departure} 天的预售期推算，${dateLabel(h.start)}出发的车票预计明天进入预售。\n具体起售日期、时间和车次请在 12306 核对。`,`${c.holiday_reminder_hour}:00`);
  }
}
const festivalNotes={
  '元旦':'ℹ️ 公历新年的第一天。放假和调休以当年的官方通知为准。',
  '建党纪念日':'ℹ️ 中国共产党成立纪念日。',
  '建军节':'ℹ️ 中国人民解放军建军纪念日。',
  '教师节':'ℹ️ 向老师表达感谢的日子。',
  '国庆节':'ℹ️ 中华人民共和国成立纪念日。放假和调休以当年的官方通知为准。'
};
for(const [md,title] of c.fixed_events) add('festival',title,`${year}-${md}`,null,festivalNotes[title]||'');
const lunarNotes={
  '春节':'ℹ️ 农历正月初一，农历新年的开始。放假日期另见“中国节假日调休”日历。',
  '元宵节':'ℹ️ 农历正月十五，常见习俗有赏灯、吃元宵或汤圆。',
  '龙抬头':'ℹ️ 农历二月初二，又称“春龙节”，各地习俗不尽相同。',
  '端午节':'ℹ️ 农历五月初五，常见习俗有吃粽子、赛龙舟。',
  '七夕节':'ℹ️ 农历七月初七，与牛郎织女传说相关。',
  '中元节':'ℹ️ 农历七月十五，各地有祭祖等民俗。',
  '中秋节':'ℹ️ 农历八月十五，常见习俗有赏月、吃月饼。',
  '重阳节':'ℹ️ 农历九月初九，常见习俗有登高、敬老。',
  '腊八节':'ℹ️ 农历十二月初八，部分地区有喝腊八粥的习俗。'
};
for(const [m,day,title] of c.lunar_events) {
  const d=lunar.get(`${m}-${day}`);
  if(!d) throw new Error(`找不到农历日期：${m}-${day}`);
  add('festival',title,d,null,lunarNotes[title]||'');
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
for(const [md,title] of terms) add('festival',`🌿 ${title}`,`${year}-${md}`,null,
  `ℹ️ ${title}是二十四节气之一；这里显示的是北京时间对应的日期，具体交节时刻以天文历算为准。`);
const nthSunday=(month,n)=>{const first=new Date(Date.UTC(year,month-1,1)).getUTCDay();return `${year}-${String(month).padStart(2,'0')}-${String(1+(7-first)%7+7*(n-1)).padStart(2,'0')}`};
add('festival','母亲节',nthSunday(5,2)); add('festival','父亲节',nthSunday(6,3));
if(c.gift_reminders) for(const r of c.gift_rules) {
  const target=r.date||(lunar.get(r.lunar.join('-')));
  if(!target) throw new Error(`礼物规则缺少日期：${r.name}`);
  add('festival',`🎁 记得准备${r.name}礼物！`,shift(target,-r.days_before),null,
    `再过 ${r.days_before} 天就是${r.name}：${dateLabel(target)}。有心意想送的话，今天可以开始准备啦。`,`${c.reminder_hour}:00`,
    `festival-${shift(target,-r.days_before)}-🎁 准备${r.name}礼物`);
}
for(const p of c.personal_events) add('festival',p.title,p.date,null,p.description||'',p.time||null);
const file=path.join(root,c.almanac_csv);
const almanacOverrides=new Map();
if(c.daily_almanac && fs.existsSync(file)) {
  const rows=fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/).slice(1);
  for(const [i,line] of rows.entries()) {
    if(!line.trim()) continue;
    const cols=line.split(',');
    if(cols.length!==4) throw new Error(`黄历 CSV 第 ${i+2} 行格式错误；字段不得含逗号`);
    const [date,yi,ji,source]=cols.map(x=>x.trim());
    if (!source || !yi || !ji) throw new Error(`黄历 CSV 第 ${i+2} 行缺少宜、忌或来源`);
    if(almanacOverrides.has(date)) throw new Error(`黄历 CSV 日期重复：${date}`);
    if(date.startsWith(`${year}-`)) almanacOverrides.set(date,{yi,ji,source});
  }
}
if(c.daily_almanac) {
  const glossary={
    '祭祀':'祭拜祖先或神明','祈福':'祈求福祉','斋醮':'传统宗教仪式',
    '求嗣':'祈求子嗣','嫁娶':'举行婚礼','冠笄':'传统成人礼',
    '出行':'外出远行','开市':'商铺开业','交易':'进行买卖',
    '会亲友':'会见亲友','入宅':'迁入新居','移徙':'搬迁',
    '动土':'建筑施工破土','破土':'墓葬工程破土','安葬':'安置逝者',
    '修造':'修建房屋','纳采':'传统婚礼的提亲礼','沐浴':'沐浴净身',
    '扫舍':'打扫房屋','馀事勿取':'其余事项不宜安排'
  };
  for(let d=`${year}-01-01`;d<=`${year}-12-31`;d=shift(d,1)) {
    const [y,m,day]=d.split('-').map(Number);
    const l=Solar.fromYmd(y,m,day).getLunar();
    const entry=almanacOverrides.get(d);
    const yi=entry?entry.yi.split('、'):l.getDayYi();
    const ji=entry?entry.ji.split('、'):l.getDayJi();
    const source=entry?entry.source:'lunar-javascript 1.7.7（民俗历法计算）';
    const notes=[...new Set([...yi,...ji])].filter(term=>glossary[term]).slice(0,5)
      .map(term=>`${term}：${glossary[term]}`).join('；');
    add('almanac','💡 今日宜忌',d,null,
      `🗓 农历${l.getMonthInChinese()}月${l.getDayInChinese()} · ${l.getYearInGanZhi()}年${l.getMonthInGanZhi()}月${l.getDayInGanZhi()}日\n✅ 宜：${yi.join('、')}\n❌ 忌：${ji.join('、')}${notes?'\n📖 看懂这些词：'+notes+'。':''}\n来源：${source}。传统民俗仅供参考。`);
  }
}
const escape=s=>String(s).replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
const fold=s=>{let lines=[],part='',bytes=0;for(const char of s){let n=Buffer.byteLength(char);if(bytes+n>75){lines.push(part);part=' '+char;bytes=1+n}else{part+=char;bytes+=n}}lines.push(part);return lines.join('\r\n')};
const write=(key,name)=> {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Personal Calendar Replica//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${escape(name)}`,'X-WR-TIMEZONE:Asia/Shanghai','REFRESH-INTERVAL;VALUE=DURATION:PT12H'];
  let seen=new Set();
  const selected = key === 'calendar' ? [...events.holiday,...events.festival] : events[key];
  for(const e of selected.sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title))) {
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
console.log(JSON.stringify([write('calendar','2026 个人日历'),write('holiday','2026 中国节假日调休'),write('festival','2026 活动纪念日'),write('almanac','2026 中国老黄历')],null,2));
const pages = path.join(root,'docs');
fs.mkdirSync(pages,{recursive:true});
for(const filename of ['calendar.ics','holiday.ics','festival.ics','almanac.ics']) {
  fs.copyFileSync(path.join(out,filename),path.join(pages,filename));
}

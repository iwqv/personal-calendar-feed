# 个人 Apple 日历订阅源 · 2026

[订阅入口](https://iwqv.github.io/personal-calendar-feed/)集中展示三类日历。按需订阅 [中国节假日调休](https://iwqv.github.io/personal-calendar-feed/holiday.ics)、[节日与纪念日](https://iwqv.github.io/personal-calendar-feed/festival.ics)、[每日黄历](https://iwqv.github.io/personal-calendar-feed/almanac.ics)，即可在 Apple 日历中独立显示和开关。此前的[合并版](https://iwqv.github.io/personal-calendar-feed/calendar.ics)继续保留；已订阅合并版的用户应先取消它再订阅分类日历，避免重复。

这是按截图中的**功能范围**制作的独立实现：不复制卖家的文案、品牌或黄历内容。日期范围只覆盖 2026 年，不自动推测 2027 年节假日。

## 完成情况

| 模块 | 当前内容 | 状态 |
|---|---|---|
| 放假调休 | 七个假期、逐日进度、补班前一晚、4 个高速免费时段、假期首日火车票预售参考 | 独立订阅源 |
| 活动纪念日 | 固定纪念日、农历节日、24 节气、母亲节、父亲节、礼物提前准备 | 独立订阅源，活动名单可继续扩充 |
| 每日黄历 | 2026 年每天的农历、传统宜忌、常用术语释义 | 独立订阅源，365 个全天事件 |

截图中“历史事件、行业日”等属于可持续增加的内容集合，当前 `config.json` 只收录了其中常见的代表项目，尚未声称穷尽截图中省略号后的全部日期。

## 文件

- `output/calendar.ics`：兼容旧用户的合并版
- `output/holiday.ics`：假期、调休、高速、抢票提醒
- `output/festival.ics`：节日、纪念日、节气、礼物提醒
- `output/almanac.ics`：每日黄历，独立订阅源
- `docs/`：GitHub Pages 发布目录，含三份分类日历、兼容旧用户的合并版和入口页；不要把个人信息发布到这里
- `config.json`：可修改日期、文案、提醒开关和个人事件
- `almanac.csv`：可按天覆盖算法结果，字段 `date,yi,ji,source`，宜忌多项用顿号分隔
- `build.mjs`：生成器，需要 Node.js 18 或更新版本和 `lunar-javascript` 依赖

## 自己维护

修改 `config.json` 后运行：

```bash
npm ci
node build.mjs
```

运行后 `docs/holiday.ics`、`docs/festival.ics`、`docs/almanac.ics` 与兼容用的 `docs/calendar.ics` 会一并更新。GitHub Pages 选择 `main` 分支的 `/docs` 文件夹；请在每次修改后重新提交 `docs/` 内的文件。

个人事件放在 `personal_events`，例如：

```json
{"title":"证件到期前检查", "date":"2026-12-01", "time":"09:00", "description":"检查证件有效期"}
```

每日黄历的宜忌由 [lunar-javascript 1.7.7](https://github.com/6tail/lunar-javascript) 按民俗历法计算，该项目采用 [MIT 许可证](https://github.com/6tail/lunar-javascript/blob/master/LICENSE)。它与国务院放假通知没有从属关系，也不存在全国统一的官方宜忌版本。常见术语解释是我们自己编写的简短释义。

如需替换某一天的结果，在 `almanac.csv` 增加一行，例如 `2026-09-18,祭祀、出行,动土、入宅,自己核对过的来源`。CSV 内容不要包含半角逗号；宜、忌和来源均不能为空。当天的自动结果会被覆盖，其余日期仍自动生成。

## 订阅与自定义

在[入口页](https://iwqv.github.io/personal-calendar-feed/)复制所需类别的订阅地址，分别在 Apple 日历中添加。下载并导入 `.ics` 只会生成一次性副本。上传和更新时保留文件名及 URL 不变。Apple 刷新时间由客户端决定，不能保证即时推送。每个分类可独立显示，但订阅日历内部的日程不可逐项编辑；需要在 `config.json` 或 `almanac.csv` 中修改并重新生成公开文件。私人生日、证件等敏感事件不要放在公开静态地址，建议继续存在自己的私有日历中。

## 核对与维护

- 2026 放假及补班：[国务院办公厅通知](https://www.scio.gov.cn/zdgz/jj/202511/t20251110_938367.html)
- 24 节气日期：[香港天文台节气表](https://www.hko.gov.hk/sc/gts/astronomy/Solar_Term.htm)，北京时间与香港时间同为 UTC+8
- 高速免费通常适用春节、清明节、劳动节、国庆节的符合条件的小客车；具体车型、免费窗口及政策调整以交通运输部门公告为准
- 12306 预售期和各站起售时间可能调整。当前配置按“含乘车当日 15 天”计算，因此假期首日前 14 天显示参考提醒；购票前请在 12306 核对
- 每年新的放假安排公布后，须**更新配置和年份相关节气数据**再重新生成；生成器会拒绝未经核实的 2027 年

保留 `UID` 和 URL 相同，重新生成同一年度的事件可在刷新后更新；请不要把生成的 `.ics` 直接混同为可编辑的 iCloud 日历。

# 个人 Apple 日历订阅源 · 2026

[订阅入口](https://iwqv.github.io/personal-calendar-feed/) · [放假调休](https://iwqv.github.io/personal-calendar-feed/holiday.ics) · [活动纪念日](https://iwqv.github.io/personal-calendar-feed/festival.ics)

这是按功能范围制作的独立日历，仅覆盖 2026 年。放假调休包含假期、补班、高速免费与抢票参考提醒；活动纪念日包含常见节日、农历节日、节气与礼物准备提醒。当前未收录全部历史事件和行业日。

在 iPhone「日历」中选择“添加订阅日历”，分别粘贴上面的 .ics 地址。订阅为只读，后续提交到同一地址的文件可由客户端刷新；刷新时间由 Apple 客户端决定。

## 维护

修改 [config.json](config.json)，使用 Node.js 18+ 运行 `node build.mjs`，然后提交更新的 `docs/holiday.ics` 和 `docs/festival.ics`。Pages 发布源是 `main` 分支的 `/docs`。下一年度须核实新的假期和节气数据后再更新配置，生成器不会自动推测 2027 年。

`almanac.csv` 是黄历数据导入入口；当前无可靠来源，未发布空黄历。请勿在公开仓库添加私人生日、证件、行程或其他敏感信息。

日期参考：[国务院办公厅 2026 年放假通知](https://www.scio.gov.cn/zdgz/jj/202511/t20251110_938367.html)、[香港天文台节气表](https://www.hko.gov.hk/sc/gts/astronomy/Solar_Term.htm)。抢票时间和高速免费政策请在使用前以官方最新公告为准。

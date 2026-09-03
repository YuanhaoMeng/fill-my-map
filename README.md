# Fill My Map

English | [中文](#中文)

Fill My Map is a local-first, open-source iOS app for exploring park trails. A
small offline map of the continental United States is included as a background;
tap a park, download its detail map, and use one exploration button to color the
trail network you visit.

## Product principles

- Minimal map-first interface with one exploration mode.
- The overview is background and navigation only; it never records road progress.
- Park maps are explicit static downloads; there is no runtime map API.
- Multiple park maps can be installed, switched, imported, and deleted locally.
- Partial coverage appears immediately; 80% of samples completes a network edge.
- Finishing an exploration creates a map screenshot that omits raw routes,
  endpoints, user location, and precise times.
- No account, telemetry, ads, cloud sync, or track upload.

The current pilot shows the 21 Michigan state parks and recreation areas whose
official DNR project boundaries intersect a 50-mile radius around Ypsilanti.
All 21 have separate on-demand trail packages. Pinckney State Recreation Area
also uses Michigan DNR data to validate official route names.

## Development

Requirements: Node.js 24, pnpm 11.19, Xcode with an iOS Simulator runtime,
`osmium-tool`, and `pmtiles`.

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm exec expo prebuild --platform ios --no-install
pnpm ios -- --device "iPhone 17 Pro"
```

Do not use Expo Go: MapLibre, background location, SQLite R-Tree, and archive
import require a native development build. Generated packages are stored under
`map-packs/`. The App embeds only the 18.7 MB low-detail overview archive;
`pnpm verify` enforces a 20 MB overview limit.

`pnpm map:fetch` restores released generated packages. `pnpm map:build:v2`
rebuilds them from pinned OSM snapshots and the recorded DNR query.

See [architecture](docs/ARCHITECTURE.md), [map packages](docs/MAP_PACK.md), and
the [iOS checklist](docs/IOS_TEST_CHECKLIST.md). Application source is MPL-2.0;
map packages are ODbL. Map data © OpenStreetMap contributors.

---

## 中文

Fill My Map 是一款本地优先、开源的 iOS 公园步道探索 App。安装包内含一张
低细节的美国本土离线背景地图；点击公园并下载详情地图后，用唯一的“开始探索”
按钮点亮到访的步道网络。

## 产品原则

- 极简、以地图为中心的界面，只有一种探索模式。
- 总览只作为背景和入口，不记录任何道路探索进度。
- 公园详情地图只在用户明确操作后静态下载，不调用运行时地图 API。
- 可在本机安装、切换、导入和删除多个公园地图。
- 部分覆盖会实时显示；采样点达到 80% 时才计入网络边的完成进度。
- 结束探索后生成地图截图，不显示原始轨迹、起终点、用户位置或精确时间。
- 无账号、遥测、广告、云同步或轨迹上传。

当前测试版显示 Michigan DNR 官方边界与 Ypsilanti 50 英里圆相交的 21 个
州立公园和游憩区，且 21 个地点均有独立的按需下载步道包。Pinckney State
Recreation Area 还使用 Michigan DNR 数据核验正式路线名。

## 本地开发

需要 Node.js 24、pnpm 11.19、带 iOS Simulator 的 Xcode、`osmium-tool`
和 `pmtiles`。

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm exec expo prebuild --platform ios --no-install
pnpm ios -- --device "iPhone 17 Pro"
```

MapLibre、后台定位、SQLite R-Tree 和地图包导入依赖原生构建，因此不能使用
Expo Go。生成包位于 `map-packs/`；App 仅内置 18.7 MB 的低细节总览包，
`pnpm verify` 会强制检查其不得超过 20 MB。

`pnpm map:fetch` 可恢复 Release 中的生成包；`pnpm map:build:v2` 使用固定
OSM 快照和已记录的 DNR 查询重新生成。

详见[架构](docs/ARCHITECTURE.md)、[地图包](docs/MAP_PACK.md)和
[iOS 验收清单](docs/IOS_TEST_CHECKLIST.md)。源码采用 MPL-2.0，地图包采用
ODbL。地图数据 © OpenStreetMap contributors。

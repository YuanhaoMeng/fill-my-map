# Fill My Map

English | [中文](#中文)

Fill My Map is a local-first, open-source iOS app for exploring public streets.
Choose a city, download its offline map, and use one exploration button to
color the roads you visit. The app binary contains no city maps.

## Product principles

- Minimal map-first interface with one exploration mode.
- City maps are explicit, static downloads; there is no runtime map API.
- Multiple maps can be installed, switched, imported, and deleted locally.
- Partial road coverage appears immediately; 80% of samples completes a road
  for city progress.
- Finishing an exploration creates a map screenshot that omits raw routes,
  endpoints, user location, and precise times.
- No account, telemetry, ads, cloud sync, or track upload.

Ann Arbor and Ypsilanti are the first downloadable city packages. More cities
can use the same versioned `.fillmap` format and static catalog.

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
import require a native development build. City packages are stored under
`map-packs/`, outside the App asset directory. `pnpm verify` enforces that the
App bundle has zero map assets.

See [architecture](docs/ARCHITECTURE.md), [map packages](docs/MAP_PACK.md), and
the [iOS checklist](docs/IOS_TEST_CHECKLIST.md). Application source is MPL-2.0;
map packages are ODbL. Map data © OpenStreetMap contributors.

---

## 中文

Fill My Map 是一款本地优先、开源的 iOS 公共道路探索 App。用户先选择城市
并下载离线地图，再用唯一的“开始探索”按钮点亮到访道路。App 安装包本身不
包含任何城市地图。

## 产品原则

- 极简、以地图为中心的界面，只有一种探索模式。
- 城市地图只在用户明确操作后静态下载，不调用运行时地图 API。
- 可在本机安装、切换、导入和删除多个城市地图。
- 道路部分覆盖会实时显示；采样点达到 80% 时才计入城市完成进度。
- 结束探索后生成地图截图，不显示原始轨迹、起终点、用户位置或精确时间。
- 无账号、遥测、广告、云同步或轨迹上传。

首批城市包为安娜堡和伊普西兰蒂；后续城市可沿用同一套带版本的 `.fillmap`
格式和静态目录。

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
Expo Go。城市包位于 `map-packs/`，不在 App 的资源目录中；`pnpm verify`
会强制检查 App 零地图内置。

详见[架构](docs/ARCHITECTURE.md)、[地图包](docs/MAP_PACK.md)和
[iOS 验收清单](docs/IOS_TEST_CHECKLIST.md)。源码采用 MPL-2.0，地图包采用
ODbL。地图数据 © OpenStreetMap contributors。

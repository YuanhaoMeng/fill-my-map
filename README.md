# Fill My Map

English | [中文](#中文)

Fill My Map is a local-first, open-source iOS app for exploring major roads and
park trails. Download a region overview or a park trail map, then use one
exploration button to color the network you visit. The app binary contains no maps.

## Product principles

- Minimal map-first interface with one exploration mode.
- Region and park maps are explicit static downloads; there is no runtime map API.
- Multiple maps can be installed, switched, imported, and deleted locally.
- Region overviews track only arterial road classes and show every indexed park.
- A park with a detail package opens its downloadable trail network.
- Partial coverage appears immediately; 80% of samples completes a network edge.
- Finishing an exploration creates a map screenshot that omits raw routes,
  endpoints, user location, and precise times.
- No account, telemetry, ads, cloud sync, or track upload.

The current pilot contains a 50-mile-radius overview centered on Ypsilanti and
two park trail packages: Pinckney State Recreation Area and County Farm Park.
Pinckney uses OSM trail geometry with Michigan DNR official route-name validation.
Legacy Ann Arbor and Ypsilanti packages and their local progress remain compatible.

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

`pnpm map:fetch` restores released generated packages. `pnpm map:build:v2`
rebuilds them from pinned OSM snapshots and the recorded DNR query.

See [architecture](docs/ARCHITECTURE.md), [map packages](docs/MAP_PACK.md), and
the [iOS checklist](docs/IOS_TEST_CHECKLIST.md). Application source is MPL-2.0;
map packages are ODbL. Map data © OpenStreetMap contributors.

---

## 中文

Fill My Map 是一款本地优先、开源的 iOS 主干道与公园步道探索 App。用户先
下载区域总览或公园步道地图，再用唯一的“开始探索”按钮点亮到访网络。App
安装包本身不包含任何地图。

## 产品原则

- 极简、以地图为中心的界面，只有一种探索模式。
- 区域与公园地图只在用户明确操作后静态下载，不调用运行时地图 API。
- 可在本机安装、切换、导入和删除多个城市地图。
- 区域总览只记录主干道路，并显示已索引的全部公园。
- 已实装详情包的公园可进入独立下载的步道网络。
- 部分覆盖会实时显示；采样点达到 80% 时才计入网络边的完成进度。
- 结束探索后生成地图截图，不显示原始轨迹、起终点、用户位置或精确时间。
- 无账号、遥测、广告、云同步或轨迹上传。

当前测试包是以 Ypsilanti 为中心、半径 50 英里的区域总览，以及 Pinckney
State Recreation Area 和 County Farm Park 两个公园步道包。Pinckney 使用
OSM 步道几何，并由 Michigan DNR 数据核验正式路线名。旧 Ann Arbor、
Ypsilanti 包及本地进度继续兼容。

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

`pnpm map:fetch` 可恢复 Release 中的生成包；`pnpm map:build:v2` 使用固定
OSM 快照和已记录的 DNR 查询重新生成。

详见[架构](docs/ARCHITECTURE.md)、[地图包](docs/MAP_PACK.md)和
[iOS 验收清单](docs/IOS_TEST_CHECKLIST.md)。源码采用 MPL-2.0，地图包采用
ODbL。地图数据 © OpenStreetMap contributors。

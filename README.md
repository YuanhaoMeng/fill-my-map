# Fill My Map

English | [中文](#中文)

Fill My Map is a local-first, open-source street exploration app. Walk or
drive public streets to color them on an original neon map, unlock landmark
rewards, and create privacy-safe share cards. iOS v0.1 focuses on Ann Arbor
and Ypsilanti, Michigan.

## Highlights

- Fully bundled offline map: no runtime map API or map download.
- Independent walking and driving progress.
- Local rewards, exclusions, undo, GPX export, and 9:16 share cards.
- Raw GPS tracks stay on the device unless the user explicitly exports them.
- No account, server, telemetry, advertising, cloud sync, or track upload.
- English and Simplified Chinese interface.

## v0.1 status

The modular client, offline map, exploration flows, rewards, sharing, and
automated simulator acceptance are complete. Physical iPhone airplane-mode,
background/locked-screen, battery, and Ann Arbor/Ypsilanti field acceptance
remain before v0.1 is considered released. See
[`docs/IOS_TEST_CHECKLIST.md`](docs/IOS_TEST_CHECKLIST.md).

## Development

Requirements: Node.js 24, pnpm 11.19, Xcode with an iOS Simulator runtime,
CocoaPods, `osmium-tool`, and `pmtiles`.

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm exec expo prebuild --platform ios --no-install
pnpm ios -- --device "iPhone 17 Pro"
```

The ready-to-use map package is already stored in
`assets/regions/ann-arbor-ypsilanti/`; rebuilding it is unnecessary. Do not use
Expo Go because background location and MapLibre require a development build.

Run the installed-app simulator acceptance suite with:

```sh
pnpm test:ios:ui <simulator-udid>
```

## Architecture and data

Pure TypeScript algorithms live in `src/core` and `src/modules`. Native APIs
are isolated in `src/platform`; UI code does not access SQLite or location APIs
directly. SQLite separates the read-only versioned road network from writable
user data. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and
[`docs/MAP_PACK.md`](docs/MAP_PACK.md).

Application source is licensed under MPL-2.0. OpenStreetMap-derived packages
are licensed under ODbL 1.0. Map data © OpenStreetMap contributors. See
[`DATA-LICENSE.md`](DATA-LICENSE.md) and [`PRIVACY.md`](PRIVACY.md).

---

## 中文

Fill My Map 是一款本地优先、开源的街道探索 App。用户可以通过步行或
驾车点亮公共道路，在原创霓虹地图上解锁地标奖励，并生成保护隐私的分享卡片。
iOS v0.1 聚焦美国密歇根州安娜堡和伊普西兰蒂。

## 主要特点

- 地图完整内置，运行时不调用地图 API，也不下载地图。
- 步行与驾车进度独立统计。
- 支持本地奖励、道路排除与撤销、GPX 导出和 9:16 分享卡片。
- 原始 GPS 轨迹默认仅保存在设备上，只有用户主动导出时才会离开设备。
- 无账号、服务器、遥测、广告、云同步或轨迹上传。
- 支持英文和简体中文界面。

## v0.1 进度

模块化客户端、离线地图、探索流程、奖励分享和模拟器自动化验收均已完成。
在正式认定 v0.1 发布前，仍需完成真实 iPhone 的飞行模式、后台与锁屏、
电池以及安娜堡/伊普西兰蒂实地验收。详见
[`docs/IOS_TEST_CHECKLIST.md`](docs/IOS_TEST_CHECKLIST.md)。

## 本地开发

需要 Node.js 24、pnpm 11.19、安装了 iOS Simulator 平台的 Xcode、
CocoaPods、`osmium-tool` 和 `pmtiles`。

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm exec expo prebuild --platform ios --no-install
pnpm ios -- --device "iPhone 17 Pro"
```

可直接使用的地图包已经位于 `assets/regions/ann-arbor-ypsilanti/`，无需重新
生成。后台定位和 MapLibre 需要本地开发构建，因此不能使用 Expo Go。

对已安装的 App 运行模拟器验收：

```sh
pnpm test:ios:ui <simulator-udid>
```

## 架构与数据许可

纯 TypeScript 算法位于 `src/core` 和 `src/modules`，原生能力隔离在
`src/platform`；UI 不会直接访问 SQLite 或定位 API。SQLite 将只读、带版本的
道路网络与可写用户数据分开。架构和地图包说明见
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) 与
[`docs/MAP_PACK.md`](docs/MAP_PACK.md)。

应用源码采用 MPL-2.0，OpenStreetMap 衍生地图包采用 ODbL 1.0。
地图数据 © OpenStreetMap contributors。详见 [`DATA-LICENSE.md`](DATA-LICENSE.md)
和 [`PRIVACY.md`](PRIVACY.md)。

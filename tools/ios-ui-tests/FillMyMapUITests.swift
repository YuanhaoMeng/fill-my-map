import XCTest

@MainActor
final class FillMyMapUITests: XCTestCase {
  private let app = XCUIApplication(bundleIdentifier: "app.fillmymap.mobile")

  override func setUp() {
    continueAfterFailure = false
    app.launch()
  }

  func testCatalogAndDownloadOverview() {
    XCTAssertTrue(app.staticTexts["Offline maps"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.staticTexts["Ypsilanti · 50 mi"].exists)
    XCTAssertTrue(app.staticTexts["Pinckney State Recreation Area"].exists)
    XCTAssertTrue(app.staticTexts["County Farm Park"].exists)
    XCTAssertEqual(app.buttons.matching(identifier: "Download").count, 3)
    app.buttons.matching(identifier: "Download").firstMatch.tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 300))
  }

  func testRelaunchesOverview() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 60))
    XCTAssertTrue(app.otherElements["Map"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts["Ypsilanti · 50 mi"].exists)
    XCTAssertTrue(app.staticTexts["© OpenStreetMap contributors"].exists)
  }

  func testLocationPermissionDenied() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 60))
    app.buttons["Start exploring"].tap()
    let error = "Background location permission is required for an active exploration."
    XCTAssertTrue(app.staticTexts[error].waitForExistence(timeout: 10))
  }

  func testFollowCoverageAndShare() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 60))
    app.buttons["Start exploring"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 20))
    let map = app.otherElements["Map"]
    map.swipeLeft()
    XCTAssertTrue(app.buttons["Resume following"].waitForExistence(timeout: 8))
    app.buttons["Resume following"].tap()
    XCTAssertTrue(app.buttons["Resume following"].waitForNonExistence(timeout: 3))
    sleep(3)
    app.buttons["Finish exploration"].tap()
    XCTAssertTrue(app.staticTexts["FILL MY MAP"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.staticTexts["Ypsilanti · 50 mi"].exists)
    let privacy = "No exact route, endpoints, home location, or precise time is shown."
    XCTAssertTrue(app.staticTexts[privacy].exists)
    attachScreenshot("overview-share-preview")
    app.buttons["Close"].tap()
  }

  func testStartSessionForInterruption() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 60))
    app.buttons["Start exploring"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 20))
    sleep(2)
  }

  func testGpxExportUsesSystemShare() {
    openMenuItem("Manage local data")
    let export = app.buttons["Export GPX"].firstMatch
    XCTAssertTrue(export.waitForExistence(timeout: 10))
    export.tap()
    sleep(2)
    XCTAssertFalse(export.isHittable)
    app.terminate()
  }

  func testDownloadParkPackagesAndReturn() {
    openMaps()
    XCTAssertEqual(app.buttons.matching(identifier: "Download").count, 2)
    app.buttons.matching(identifier: "Download").firstMatch.tap()
    assertActiveMap("Pinckney State Recreation Area", timeout: 180)
    app.buttons["Close"].tap()
    XCTAssertTrue(backButton.waitForExistence(timeout: 60))
    backButton.tap()
    XCTAssertTrue(app.staticTexts["Ypsilanti · 50 mi"].waitForExistence(timeout: 60))
    openMaps()
    app.buttons["Download"].tap()
    assertActiveMap("County Farm Park", timeout: 180)
    app.buttons["Close"].tap()
    XCTAssertTrue(backButton.waitForExistence(timeout: 60))
    backButton.tap()
    XCTAssertTrue(app.staticTexts["Ypsilanti · 50 mi"].waitForExistence(timeout: 60))
  }

  func testOpenPinckneyFromOverviewMarker() {
    let map = app.otherElements["Map"]
    XCTAssertTrue(map.waitForExistence(timeout: 60))
    map.coordinate(withNormalizedOffset: CGVector(dx: 0.295, dy: 0.378)).tap()
    let alert = app.alerts["Pinckney State Recreation Area"]
    XCTAssertTrue(alert.waitForExistence(timeout: 10))
    alert.buttons["Open"].tap()
    XCTAssertTrue(backButton.waitForExistence(timeout: 60))
  }

  func testDeleteCountyFarmKeepsOverview() {
    XCTAssertTrue(backButton.waitForExistence(timeout: 60))
    backButton.tap()
    openMaps()
    let deletes = app.buttons.matching(identifier: "×")
    XCTAssertEqual(deletes.count, 3)
    deletes.element(boundBy: 2).tap()
    let alert = app.alerts["Delete this map?"]
    XCTAssertTrue(alert.waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["Exploration progress will be kept on this device."].exists)
    alert.buttons["Delete"].tap()
    XCTAssertTrue(app.buttons["Download"].waitForExistence(timeout: 15))
    app.buttons["Close"].tap()
    XCTAssertTrue(app.staticTexts["Ypsilanti · 50 mi"].waitForExistence(timeout: 60))
  }

  func testImportCountyFarmFromFiles() {
    openMaps()
    selectImportFile("county-farm-park-2026.08.29-v3.fillmap")
    assertActiveMap("County Farm Park", timeout: 60)
  }

  func testRejectsTruncatedParkMap() {
    openMaps()
    selectImportFile("truncated-pinckney.fillmap")
    XCTAssertTrue(app.buttons["Import .fillmap"].waitForExistence(timeout: 15))
    XCTAssertTrue(app.staticTexts["Active"].exists)
    XCTAssertTrue(app.staticTexts["County Farm Park"].exists)
  }

  private var backButton: XCUIElement {
    app.buttons["Back to region"]
  }

  private func openMaps() {
    openMenuItem("Offline maps")
    let subtitle = "Choose a region or park map to explore."
    XCTAssertTrue(app.staticTexts[subtitle].waitForExistence(timeout: 10))
  }

  private func openMenuItem(_ label: String) {
    XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 60))
    app.buttons["Menu"].tap()
    XCTAssertTrue(app.buttons[label].waitForExistence(timeout: 5))
    app.buttons[label].tap()
  }

  private func selectImportFile(_ name: String) {
    app.buttons["Import .fillmap"].tap()
    let file = app.descendants(matching: .any)
      .matching(NSPredicate(format: "label CONTAINS %@", name)).firstMatch
    if !file.waitForExistence(timeout: 2) {
      let browse = app.tabBars.buttons["Browse"]
      if browse.waitForExistence(timeout: 5) { browse.tap() }
    }
    if !file.waitForExistence(timeout: 3) {
      let local = app.cells.containing(.staticText, identifier: "On My iPhone").firstMatch
      if local.waitForExistence(timeout: 5) { local.tap() }
    }
    XCTAssertTrue(file.waitForExistence(timeout: 15))
    file.tap()
  }

  private func assertActiveMap(_ name: String, timeout: TimeInterval) {
    XCTAssertTrue(app.staticTexts["Active"].waitForExistence(timeout: timeout))
    XCTAssertTrue(app.staticTexts[name].exists)
  }

  private func attachScreenshot(_ name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }
}

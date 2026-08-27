import XCTest

@MainActor
final class FillMyMapUITests: XCTestCase {
  private let app = XCUIApplication(bundleIdentifier: "app.fillmymap.mobile")

  override func setUp() {
    continueAfterFailure = false
    app.launch()
  }

  func testCatalogAndDownloadAnnArbor() {
    XCTAssertTrue(app.staticTexts["City maps"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.staticTexts["Ann Arbor"].exists)
    XCTAssertTrue(app.staticTexts["Ypsilanti"].exists)
    XCTAssertEqual(app.buttons.matching(identifier: "Download").count, 2)
    app.buttons.matching(identifier: "Download").firstMatch.tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 120))
    XCTAssertTrue(app.staticTexts["Ann Arbor"].exists)
    XCTAssertTrue(app.otherElements["Map"].waitForExistence(timeout: 20))
  }

  func testRelaunchesInstalledMap() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.otherElements["Map"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.staticTexts["Ann Arbor"].exists)
    XCTAssertTrue(app.staticTexts["© OpenStreetMap contributors"].exists)
  }

  func testLocationPermissionDenied() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    app.buttons["Start exploring"].tap()
    let error = "Background location permission is required for an active exploration."
    XCTAssertTrue(app.staticTexts[error].waitForExistence(timeout: 10))
    XCTAssertTrue(app.buttons["Start exploring"].exists)
  }

  func testFollowPartialCoverageAndSharePreview() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    app.buttons["Start exploring"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 15))
    XCTAssertTrue(app.staticTexts["Recording — works while locked"].exists)
    let map = app.otherElements["Map"]
    map.swipeLeft()
    XCTAssertTrue(app.buttons["Resume following"].waitForExistence(timeout: 8))
    app.buttons["Resume following"].tap()
    XCTAssertFalse(app.buttons["Resume following"].exists)
    sleep(3)
    app.buttons["Finish exploration"].tap()
    XCTAssertTrue(app.staticTexts["FILL MY MAP"].waitForExistence(timeout: 20))
    XCTAssertTrue(app.staticTexts["Ann Arbor"].exists)
    XCTAssertTrue(app.staticTexts["© OpenStreetMap contributors"].exists)
    XCTAssertTrue(app.staticTexts["No exact route, endpoints, home location, or precise time is shown."].exists)
    XCTAssertFalse(app.staticTexts["Recording — works while locked"].exists)
    attachScreenshot("exploration-share-preview")
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 8))
  }

  func testDownloadSwitchAndDeleteYpsilanti() {
    openCityMaps()
    XCTAssertEqual(app.buttons.matching(identifier: "Download").count, 1)
    app.buttons["Download"].tap()
    assertActiveMap(city: "Ypsilanti", timeout: 120)
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts["Ypsilanti"].exists)
    XCTAssertTrue(app.otherElements["Map"].waitForExistence(timeout: 20))
    attachScreenshot("ypsilanti-offline-map")
    openCityMaps()
    app.buttons["Open"].tap()
    XCTAssertTrue(app.staticTexts["Ann Arbor"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts["Active"].exists)
    let deleteButtons = app.buttons.matching(identifier: "×")
    XCTAssertEqual(deleteButtons.count, 2)
    deleteButtons.element(boundBy: 1).tap()
    XCTAssertTrue(app.alerts["Delete this city map?"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["Exploration progress will be kept on this device."].exists)
    app.alerts.buttons["Delete"].tap()
    XCTAssertTrue(app.buttons["Download"].waitForExistence(timeout: 15))
    XCTAssertEqual(app.buttons.matching(identifier: "×").count, 1)
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 20))
  }

  func testStartSessionForInterruption() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    app.buttons["Start exploring"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 15))
    sleep(2)
  }

  func testGpxExportUsesSystemShare() {
    openMenuItem("Manage local data")
    let export = app.buttons["Export GPX"].firstMatch
    XCTAssertTrue(export.waitForExistence(timeout: 10))
    export.tap()
    sleep(2)
    XCTAssertTrue(export.exists)
    XCTAssertFalse(export.isHittable)
    app.terminate()
  }

  func testImportYpsilantiFromFiles() {
    openCityMaps()
    selectImportFile("ypsilanti-2026.08.24-v2.fillmap")
    assertActiveMap(city: "Ypsilanti", timeout: 60)
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts["Ypsilanti"].exists)
    XCTAssertTrue(app.otherElements["Map"].waitForExistence(timeout: 20))
  }

  func testDeleteAndImportAnnArbor() {
    openCityMaps()
    app.buttons.matching(identifier: "×").element(boundBy: 0).tap()
    XCTAssertTrue(app.alerts["Delete this city map?"].waitForExistence(timeout: 5))
    app.alerts.buttons["Delete"].tap()
    XCTAssertTrue(app.buttons["Download"].waitForExistence(timeout: 15))
    selectImportFile("ann-arbor-2026.08.24-v2.fillmap")
    assertActiveMap(city: "Ann Arbor", timeout: 60)
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts["Ann Arbor"].exists)
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

  private func openCityMaps() {
    openMenuItem("City maps")
    XCTAssertTrue(app.staticTexts["Choose a city map to explore."].waitForExistence(timeout: 10))
  }

  private func openMenuItem(_ label: String) {
    XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 30))
    app.buttons["Menu"].tap()
    XCTAssertTrue(app.buttons[label].waitForExistence(timeout: 5))
    app.buttons[label].tap()
  }

  private func assertActiveMap(city: String, timeout: TimeInterval) {
    XCTAssertTrue(app.staticTexts["Active"].waitForExistence(timeout: timeout))
    XCTAssertTrue(app.staticTexts[city].exists)
  }

  private func attachScreenshot(_ name: String) {
    let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }
}

import XCTest

@MainActor
final class FillMyMapUITests: XCTestCase {
  private let app = XCUIApplication(bundleIdentifier: "app.fillmymap.mobile")

  override func setUp() {
    continueAfterFailure = false
    app.launch()
  }

  func testOverviewHasNoExploration() {
    XCTAssertTrue(app.otherElements["Map"].waitForExistence(timeout: 60))
    if app.buttons["Back to region"].exists {
      app.buttons["Back to region"].tap()
    }
    XCTAssertTrue(app.staticTexts["Tap a park to open or download its trail map."].exists)
    XCTAssertFalse(app.buttons["Start exploring"].exists)
    XCTAssertTrue(app.buttons["Center on my location"].exists)
    openMaps()
    XCTAssertTrue(app.staticTexts["Pinckney State Recreation Area"].waitForExistence(timeout: 20))
    XCTAssertEqual(downloadButtons.count, 21)
  }

  func testDownloadPinckney() {
    openMaps()
    let download = app.buttons["Download Pinckney State Recreation Area"]
    XCTAssertTrue(download.waitForExistence(timeout: 20))
    XCTAssertEqual(downloadButtons.count, 21)
    download.tap()
    XCTAssertTrue(app.staticTexts["Active"].waitForExistence(timeout: 180))
    XCTAssertTrue(app.staticTexts["Pinckney State Recreation Area"].exists)
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Back to region"].waitForExistence(timeout: 60))
    XCTAssertTrue(app.buttons["Start exploring"].exists)
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
    XCTAssertTrue(app.staticTexts["Pinckney State Recreation Area"].exists)
    let privacy = "No exact route, endpoints, home location, or precise time is shown."
    XCTAssertTrue(app.staticTexts[privacy].exists)
    app.buttons["Close"].tap()
  }

  func testStartSessionForInterruption() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 60))
    app.buttons["Start exploring"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 20))
    sleep(2)
  }

  func testRelaunchesPark() {
    XCTAssertTrue(app.buttons["Start exploring"].waitForExistence(timeout: 60))
    XCTAssertTrue(app.buttons["Back to region"].exists)
    XCTAssertTrue(app.otherElements["Map"].exists)
  }

  func testReturnToOverviewAndOpenMarker() {
    XCTAssertTrue(app.buttons["Back to region"].waitForExistence(timeout: 60))
    let returnStarted = Date()
    app.buttons["Back to region"].tap()
    XCTAssertTrue(app.staticTexts["Tap a park to open or download its trail map."].waitForExistence(timeout: 4))
    XCTAssertLessThan(Date().timeIntervalSince(returnStarted), 4)
    let map = app.otherElements["Map"]
    map.coordinate(withNormalizedOffset: CGVector(dx: 0.295, dy: 0.378)).tap()
    let alert = app.alerts["Pinckney State Recreation Area"]
    XCTAssertTrue(alert.waitForExistence(timeout: 10))
    let openStarted = Date()
    alert.buttons["Open"].tap()
    XCTAssertTrue(app.buttons["Back to region"].waitForExistence(timeout: 4))
    XCTAssertLessThan(Date().timeIntervalSince(openStarted), 4)
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

  private func openMaps() {
    openMenuItem("Offline maps")
    XCTAssertTrue(app.staticTexts["Choose a region or park map to explore."].waitForExistence(timeout: 10))
  }

  private var downloadButtons: XCUIElementQuery {
    app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'Download '"))
  }

  private func openMenuItem(_ label: String) {
    XCTAssertTrue(app.buttons["Menu"].waitForExistence(timeout: 60))
    app.buttons["Menu"].tap()
    XCTAssertTrue(app.buttons[label].waitForExistence(timeout: 5))
    app.buttons[label].tap()
  }
}

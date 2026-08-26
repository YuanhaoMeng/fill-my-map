import XCTest

@MainActor
final class FillMyMapUITests: XCTestCase {
  private let app = XCUIApplication(bundleIdentifier: "app.fillmymap.mobile")

  override func setUp() {
    continueAfterFailure = false
    app.launch()
    XCTAssertTrue(app.buttons["Start walk"].waitForExistence(timeout: 15))
  }

  func testLaunchesInstalledApp() {
    XCTAssertTrue(app.staticTexts["© OpenStreetMap contributors"].exists)
  }

  func testResetAllData() {
    app.buttons["Manage local data"].tap()
    XCTAssertTrue(app.staticTexts["Data & history"].waitForExistence(timeout: 5))
    app.buttons["Reset all app data"].tap()
    app.alerts.buttons["Continue"].tap()
    XCTAssertTrue(app.alerts["Really reset everything?"].waitForExistence(timeout: 5))
    app.alerts.buttons["Reset"].tap()
    XCTAssertTrue(app.staticTexts["No exploration sessions yet."].waitForExistence(timeout: 5))
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Rewards · 0"].waitForExistence(timeout: 5))
  }

  func testLocationPermissionCanBeDenied() {
    addUIInterruptionMonitor(withDescription: "Location permission") { alert in
      guard alert.buttons["Don’t Allow"].exists else { return false }
      alert.buttons["Don’t Allow"].tap()
      return true
    }
    app.buttons["Start walk"].tap()
    app.tap()
    let message = "Background location permission is required for an active exploration."
    XCTAssertTrue(app.staticTexts[message].waitForExistence(timeout: 5))
    XCTAssertTrue(app.buttons["Start walk"].exists)
  }

  func testRecordsAndPersistsWalk() {
    app.buttons["Start walk"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 8))
    XCTAssertTrue(app.staticTexts["Recording — works while locked"].exists)
    XCTAssertTrue(app.buttons["Rewards · 1"].waitForExistence(timeout: 12))
    app.buttons["Finish exploration"].tap()
    XCTAssertTrue(app.buttons["Start walk"].waitForExistence(timeout: 8))
    app.buttons["Manage local data"].tap()
    let walk = NSPredicate(format: "label CONTAINS 'Walking ·'")
    XCTAssertTrue(app.staticTexts.matching(walk).firstMatch.waitForExistence(timeout: 5))
    let completed = NSPredicate(format: "label CONTAINS 'points · completed'")
    XCTAssertTrue(app.staticTexts.matching(completed).firstMatch.exists)
    app.buttons["Close"].tap()
    app.buttons["Rewards · 1"].tap()
    XCTAssertTrue(element(containing: "The Diag").waitForExistence(timeout: 5))
  }

  func testRecordsCoveragePoint() {
    app.buttons["Start walk"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 8))
    let map = app.otherElements["Map"]
    XCTAssertTrue(map.waitForExistence(timeout: 5))
    map.swipeLeft()
    let resume = app.buttons["Resume following"]
    XCTAssertTrue(resume.waitForExistence(timeout: 5))
    resume.tap()
    XCTAssertFalse(resume.exists)
    sleep(3)
    app.buttons["Finish exploration"].tap()
    XCTAssertTrue(app.buttons["Start walk"].waitForExistence(timeout: 8))
    app.buttons["Manage local data"].tap()
    let completed = NSPredicate(format: "label CONTAINS 'points · completed'")
    XCTAssertTrue(app.staticTexts.matching(completed).firstMatch.waitForExistence(timeout: 5))
    app.buttons["Close"].tap()
  }

  func testDriveSession() {
    app.buttons["Start drive"].tap()
    XCTAssertTrue(app.buttons["Finish exploration"].waitForExistence(timeout: 8))
    sleep(3)
    app.buttons["Finish exploration"].tap()
    XCTAssertTrue(app.buttons["Manage local data"].waitForExistence(timeout: 8))
    app.buttons["Manage local data"].tap()
    let drive = NSPredicate(format: "label CONTAINS 'Driving ·'")
    XCTAssertTrue(app.staticTexts.matching(drive).firstMatch.waitForExistence(timeout: 5))
  }

  func testRewardShareSheet() {
    app.buttons["Rewards · 1"].tap()
    let reward = element(containing: "The Diag")
    XCTAssertTrue(reward.waitForExistence(timeout: 5))
    reward.tap()
    shareAndAssert(app.buttons["Share"])
  }

  func testProgressShareSheet() {
    let row = NSPredicate(format: "label CONTAINS 'Ann Arbor' AND label CONTAINS 'Walking'")
    let progress = app.buttons.matching(row).firstMatch
    XCTAssertTrue(progress.waitForExistence(timeout: 5))
    progress.tap()
    XCTAssertTrue(app.staticTexts["CITY PROGRESS"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["© OpenStreetMap contributors"].exists)
    shareAndAssert(app.buttons["Share"])
  }

  func testGpxShareSheet() {
    app.buttons["Manage local data"].tap()
    let export = app.buttons["Export GPX"].firstMatch
    XCTAssertTrue(export.waitForExistence(timeout: 5))
    shareAndAssert(export)
  }

  func testDeleteTracksKeepsProgress() {
    app.buttons["Manage local data"].tap()
    XCTAssertTrue(app.buttons["Delete"].firstMatch.waitForExistence(timeout: 5))
    app.buttons["Delete"].firstMatch.tap()
    app.alerts.buttons["Delete"].tap()
    app.buttons["Delete all raw tracks"].tap()
    app.alerts.buttons["Delete"].tap()
    XCTAssertTrue(app.staticTexts["0 points · completed"].firstMatch.waitForExistence(timeout: 5))
    app.buttons["Close"].tap()
    XCTAssertTrue(app.buttons["Rewards · 1"].waitForExistence(timeout: 5))
  }

  func testExcludeAndRestoreRoad() {
    let map = app.otherElements["Map"]
    XCTAssertTrue(map.waitForExistence(timeout: 5))
    let offsets = [
      CGVector(dx: 0.216, dy: 0.452), CGVector(dx: 0.22, dy: 0.45),
      CGVector(dx: 0.21, dy: 0.46), CGVector(dx: 0.24, dy: 0.50),
    ]
    var selected: XCUICoordinate?
    for offset in offsets {
      let coordinate = map.coordinate(withNormalizedOffset: offset)
      coordinate.press(forDuration: 1.2)
      if app.alerts["Exclude this road?"].waitForExistence(timeout: 1) {
        selected = coordinate
        break
      }
    }
    XCTAssertNotNil(selected)
    app.alerts.buttons["Walking"].tap()
    XCTAssertTrue(app.alerts["Why is it unreachable?"].waitForExistence(timeout: 3))
    app.alerts.buttons["Private"].tap()
    sleep(2)
    selected?.press(forDuration: 1.2)
    XCTAssertTrue(app.alerts["Restore this road?"].waitForExistence(timeout: 4))
    app.alerts.buttons["Walking"].tap()
  }

  private func element(containing text: String) -> XCUIElement {
    app.descendants(matching: .any).matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
  }

  private func shareAndAssert(_ element: XCUIElement) {
    XCTAssertTrue(element.waitForExistence(timeout: 5))
    element.tap()
    sleep(2)
    XCTAssertTrue(element.exists)
    XCTAssertFalse(element.isHittable)
    let screenshot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
    screenshot.lifetime = .keepAlways
    add(screenshot)
  }
}

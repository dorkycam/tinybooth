//
//  TinyBoothUITests.swift
//  TinyBoothUITests
//
//  UI test that walks the 6 hero screens for App Store screenshots and calls
//  `snapshot()` at each. Each call uses a keyword-rich label so the
//  generated PNG names already encode the ASO copy that frameit will overlay.
//
//  Per docs/research/seo.md section 5 ("Screenshot order"):
//    1. Hero shot (camera + countdown)
//    2. Photostrip preview with print button
//    3. Layout picker showing 5 layouts
//    4. Connect to event flow
//    5. Event branding applied to a strip
//    6. Help screen with Guided Access setup
//
//  Each screen is reached via deeplink so the test does not depend on tap
//  paths from the home screen. Deeplinks are registered in the Expo router
//  (`apps/mobile/app/`) and resolved by the `tinybooth://` scheme.
//

import XCTest

final class TinyBoothUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        setupSnapshot(app)
        app.launchArguments += ["--ui-test-mode", "--seed-fixtures"]
        app.launch()
    }

    /// Hero shot: live camera with the 3-second countdown overlay visible.
    /// Caption baked into ASO frameit overlay: "Real photo booth, free on iPad".
    func testCameraWithCountdown() throws {
        let app = XCUIApplication()
        let openCamera = app.buttons["start-a-booth"]
        XCTAssertTrue(openCamera.waitForExistence(timeout: 10))
        openCamera.tap()

        let captureButton = app.buttons["capture-button"]
        XCTAssertTrue(captureButton.waitForExistence(timeout: 5))
        captureButton.tap()

        let countdown = app.staticTexts["countdown-overlay"]
        XCTAssertTrue(countdown.waitForExistence(timeout: 3))
        snapshot("01-camera-with-countdown")
    }

    /// Strip preview screen with the Print, Share, Save controls visible.
    /// Caption overlay: "Print classic 1x4 photo strips".
    func testStripPreviewWithPrint() throws {
        let app = XCUIApplication()
        XCUIDevice.shared.system.open(URL(string: "tinybooth://(camera)/preview?fixture=1x4_classic")!)
        let printButton = app.buttons["preview-print"]
        XCTAssertTrue(printButton.waitForExistence(timeout: 10))
        snapshot("02-strip-preview-print")
    }

    /// Layout picker bottom sheet showing all five strip layouts.
    /// Caption overlay: "Five strip layouts, 1x4 to 2x2".
    func testLayoutPickerFiveLayouts() throws {
        let app = XCUIApplication()
        XCUIDevice.shared.system.open(URL(string: "tinybooth://(tabs)/settings?focus=layout")!)
        let picker = app.otherElements["layout-picker"]
        XCTAssertTrue(picker.waitForExistence(timeout: 10))
        snapshot("03-layout-picker")
    }

    /// Connect to event tab showing the slug entry + QR scan path.
    /// Caption overlay: "Connect the booth to your event".
    func testConnectToEventFlow() throws {
        let app = XCUIApplication()
        XCUIDevice.shared.system.open(URL(string: "tinybooth://(tabs)/event")!)
        let slugField = app.textFields["event-slug-input"]
        XCTAssertTrue(slugField.waitForExistence(timeout: 10))
        snapshot("04-connect-to-event")
    }

    /// Event branding applied to a finished strip (logo + accent color).
    /// Caption overlay: "Branded strips for weddings and parties".
    func testEventBrandingOnStrip() throws {
        let app = XCUIApplication()
        XCUIDevice.shared.system.open(URL(string: "tinybooth://(camera)/preview?fixture=branded_event")!)
        let brandedStrip = app.images["preview-strip-branded"]
        XCTAssertTrue(brandedStrip.waitForExistence(timeout: 10))
        snapshot("05-event-branding")
    }

    /// Help screen featuring the Guided Access setup walkthrough.
    /// Caption overlay: "Guided Access keeps the booth on one screen".
    func testHelpWithGuidedAccess() throws {
        let app = XCUIApplication()
        XCUIDevice.shared.system.open(URL(string: "tinybooth://(tabs)/help#guided-access")!)
        let guidedHeading = app.staticTexts["help-guided-access"]
        XCTAssertTrue(guidedHeading.waitForExistence(timeout: 10))
        snapshot("06-help-guided-access")
    }
}

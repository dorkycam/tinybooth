# TinyBooth iOS App - Feature and Architecture Inventory

**Last Updated:** April 2026  
**Original Project:** Swift/iOS, currently live on App Store  
**Repository:** https://github.com/csuncodesquadgroup/tinybooth (read-only reference)

---

## 1. Bundle ID

**Exact Bundle ID:** `com.codesquad.tinybooth`

Location: `/tinybooth-old/tinybooth.xcodeproj/project.pbxproj` (lines with `PRODUCT_BUNDLE_IDENTIFIER`)

This Bundle ID must be preserved when shipping the new app to update existing users through the App Store.

---

## 2. Camera & Capture Flow

### Hardware & API
- **Camera Library:** AVFoundation (native iOS camera framework)
- **Capture Session:** `AVCaptureSession` with `.photo` preset for full-resolution photos
- **Photo Output:** `AVCapturePhotoOutput` with JPEG codec
- **Camera Position:** Front-facing camera only (hardcoded for photobooth use case)
- **Flash Support:** Optional (toggle button included; disabled for iPad Air 2)

### Capture Sequence
1. User taps "Start" button
2. 3-second countdown begins (visual countdown box + audio cue)
3. Timer fires 4 times at 1-second intervals
4. Each trigger calls `takePhoto()` which captures via `AVCapturePhotoCaptureDelegate`
5. After 4th photo, countdown hides and "All done!" message appears
6. Start button turns green
7. Session transitions to preview screen

### Audio
- **Countdown Sound:** `countdownSound_1.mp3` plays on each countdown tick (loaded once in `viewDidLoad`)
- **Shutter Sound:** `shutterSound.mp3` (defined but not used in code; may be dead code)

### Key Code References
- `ViewController.swift:221-261` - Main capture logic with timer
- `ViewController.swift:278-305` - Photo capture and random message display
- `ViewController.swift:390-401` - `AVCapturePhotoCaptureDelegate` implementation (saves to disk)
- `ViewController.swift:142-189` - AVFoundation setup functions

### Messages Display
After each photo is taken, a random message from the `sillyMessages` array is shown over the camera preview for ~1 second.

---

## 3. Photostrip Layout(s)

### Current Layout (Fixed)
- **Only 1 layout:** 1x4 vertical photostrip (4 photos in a single column, mirrored/duplicated layout)
- **Dimensions:**
  - Output dimensions: `800 x 1200` pixels (PhotoUtil.swift:17-18)
  - Photo aspect ratio preserved via cropping before rendering

### Layout Details
- **Structure:** 4 photos rendered in 2 columns, side-by-side (see PhotoUtil.swift:31-62)
  - Left column: photos at `x=MARGIN` (30px)
  - Right column: photos at `x=(MARGIN*3)+STRIP_PHOTO_WIDTH` (offset + first column width)
  - All rows: `y=MARGIN + ((STRIP_PHOTO_HEIGHT*i) + (MARGIN*i))`

- **Margins:** 30px on all sides (PhotoUtil.swift:19)

- **Photo Dimensions Per Photostrip:**
  - Strip photo height: `(OUTPUT_HEIGHT - MARGIN) / 4 - MARGIN` pixels
  - Strip photo width: `(OUTPUT_WIDTH / 2) - (MARGIN * 2)` pixels

### Device-Specific Cropping
Device model name is detected (ViewController.swift:348-361) to adjust the crop rectangle before rendering:
- **iPad Air 2:** `CGRect(x: 0, y: 0, width: 2300, height: 700)`
- **iPhone 11:** `CGRect(x: 0, y: 0, width: 3000, height: 2217)`
- **Other devices:** `CGRect(x: 0, y: 0, width: 2300, height: 1700)`

### No Watermark/Logo in Current Build
There is no visible watermark or logo rendered on the photostrip. The layout is purely photos + margins.

### Not Configurable
Layout is hardcoded. No user settings exist to change layout, dimensions, or borders. The design is production-ready and intentionally simple.

---

## 4. Printer Integration

### Print API
- **Framework:** UIKit (native iOS printing)
- **Method:** `UIPrintInteractionController` (iOS standard AirPrint)
- **Supported Printer Types:** Any printer supporting AirPrint (network, Bluetooth, cloud printers)

### Print Flow
1. User taps "Print" button on preview screen (PreviewViewController.swift:45-47)
2. Code creates `UIPrintInfo` with `outputType = .photo`
3. `UIPrintInteractionController.shared` is configured with:
   - `printInfo` set to the UIPrintInfo object
   - `showsNumberOfCopies = false` (always prints 1 copy)
   - `printingItem = photoStripImage` (the rendered photostrip UIImage)
4. Print dialog presented with `present(from:in:animated:completionHandler:)`
5. User selects printer and number of copies in system dialog

### Print Sizes
- Print size is NOT hardcoded in the app; determined by printer/user selection in the system print dialog
- Photostrip dimensions (800x1200px) scale to fit selected paper size automatically

### Code References
- `ViewController.swift:321-342` - `previewPrinted()` delegate method
- `PreviewViewController.swift:44-52` - Print button handler

### No Custom Print Configuration
The app does not:
- Set specific paper sizes
- Add borders or frames for printing
- Modify color profiles
- Support specialty print services (Snapfish, etc.)
- Add metadata or instructions to the print job

---

## 5. Camera Roll / Saving

### Photo Storage
After each capture, raw photo data is saved to the app's documents directory using `PhotoUtil.savePhotoToDisk()`:
- **Path:** `{Documents Directory}/photo 0.jpg`, `photo 1.jpg`, etc.
- **Format:** JPEG at 0.8 compression quality
- **Naming:** Sequential based on capture order

### Location
- Photos stored locally on device only
- No cloud upload, sync, or backup (app doesn't have network capability)
- Temporary sharing via NSTemporaryDirectory (see below)

### Sharing Flow
1. User taps "Share" button on preview screen (PreviewViewController.swift:55-83)
2. Photostrip image is written to temp directory as `Your Photo! -tinybooth.jpg`
3. `UIActivityViewController` presents iOS share sheet with:
   - Photos
   - Messages
   - Mail
   - etc. (all standard iOS share options)
4. Print activity explicitly excluded from share sheet
5. After share sheet appears, preview is dismissed (previewDismissed() called)

### No Local Retention After Share
- Photos remain in Documents directory until app is deleted
- Share action does not delete or clear the strip
- User can tap Share multiple times to send the same strip to different channels

### Camera Roll Export
- Photostrip CAN be saved to camera roll via the share sheet (select "Save Image" from Photos app activity)
- App does NOT automatically save to camera roll
- App does NOT provide explicit "Save to Camera Roll" button

### Code References
- `PhotoUtil.swift:68-75` - Save photo to disk
- `PhotoUtil.swift:77-80` - Get documents directory path
- `PreviewViewController.swift:55-83` - Share sheet implementation

---

## 6. Random Message Library

### Complete Message List
The messages are hardcoded in `ViewController.swift:43` in the `sillyMessages` array:

```swift
let sillyMessages = [
    "Smile!",
    "Cheese!",
    "Work it!",
    "Cute!",
    "Perfect!",
    "Pose!",
    "Adorable!",
    "That's Great!",
    "😎"  // Cool face emoji (Unicode \u{1F60E})
]
```

**Total:** 9 messages (8 text + 1 emoji)

### Display Behavior
- **When:** Immediately after each photo is captured (takePhoto method)
- **Where:** Large black box overlay in the center of the preview, covers the camera view
- **Font Size:** Dynamically scaled based on device width (ViewController.swift:86)
- **Duration:** Shown until next photo or user action; replaced by next message on next capture
- **Selection:** Truly random using `sillyMessages.randomElement()`

### Code Reference
- `ViewController.swift:43` - Message array definition
- `ViewController.swift:298-300` - Message selection and display

### Not Configurable in Current App
- No settings screen to customize messages
- No ability to add/remove messages in the app
- Not stored persistently (hardcoded only)
- Same list for all users; no user-specific customization

---

## 7. Settings / Customization

### Available User Controls
There are NO user settings or preference screens in the app. The only user-configurable element is:

**Flash Toggle:**
- **Location:** Top-right corner of main camera view
- **Default State:** Off (flashToggleOn = false)
- **Behavior:** Toggle shows/hides button icon (bolt.fill vs bolt.slash.fill)
- **Storage:** Not persisted; resets to off when app reopens
- **Code:** `ViewController.swift:264-275`

### No Other Settings
- No brightness/contrast controls
- No layout selection
- No message customization
- No sound on/off toggle (countdown sound always plays)
- No timer duration adjustment (always 3 seconds, always 4 photos)
- No printer preset configuration
- No camera effects or filters

### Device Detection (Not User-Facing)
Device model is detected to adjust UI layout, but this is automatic, not a user setting:
- `UIDevice.modelName` property detects device type
- Special handling for iPad Air 2, iPhone 11, iPhone 8, iPhone 7, iPhone 6, iPad Pro 12"
- Adjusts button corner radius, countdown font size, border heights

---

## 8. UI Screens & Navigation

### Screen 1: Main Camera Screen (ViewController)
**Path:** Root view controller (loaded from Main.storyboard)
**Purpose:** Primary photobooth interface; preview camera feed and capture photos
**Elements:**
- Full-screen front camera preview
- "Start" button (large, centered, green circle)
- Flash toggle button (top-right, bolt icon)
- Help button (top-left)
- Countdown timer box (hidden until capture begins)
- Random message display (hidden until photo taken)
- Top/bottom decorative borders (thin bars)

**Navigation:**
- Segue to Help Screen (modal) via Help button
- Segue to Preview Screen (modal) via internal trigger after 4 photos captured

### Screen 2: Preview / Review Screen (PreviewViewController)
**Path:** Modal over main camera screen
**Purpose:** View the completed 4-photo photostrip before printing/sharing
**Elements:**
- Full-screen photostrip image display
- "Redo" button (trash icon, top-left) - dismisses and returns to camera
- "Print" button (top-center) - initiates AirPrint dialog
- "Share" button (top-right) - opens iOS share sheet

**Navigation:**
- Dismiss (back to Main Camera) via Redo button
- Print dialog via Print button (stays on preview after print completes)
- Share sheet via Share button (dismisses preview after sheet closes)

### Screen 3: Help Screen (HelpViewController)
**Path:** Modal over main camera screen
**Purpose:** Show app documentation and links
**Elements:**
- Exit button (top-right, close icon)
- Single text view with hyperlinked text:
  - Text: "Visit our github to submit new feature requests and bug reports."
  - Link: Points to https://github.com/csuncodesquadgroup/tinybooth
  - Background: Dark (viewFlipsideBackgroundColor)
  - Text color: White

**Navigation:**
- Dismiss via Exit button (back to Main Camera)

### Screen 4: Print Dialog (System)
**Path:** Presented by UIKit, not part of app UI
**Purpose:** Standard iOS printer/AirPrint selection
**Elements:** System-provided (user selects printer, number of copies, etc.)

### Screen 5: Share Sheet (System)
**Path:** Presented by UIKit via UIActivityViewController
**Purpose:** iOS standard share options (Messages, Mail, Photos, etc.)
**Elements:** System-provided (varies by device and installed apps)

### Navigation Flow Diagram
```
Main Camera Screen
  ├─ (User taps Help) → Help Screen → (Exit button) → Main Camera
  ├─ (User taps Start) → 3-second countdown → (4 photos captured) → Preview Screen
  │  ├─ (User taps Redo) → Main Camera
  │  ├─ (User taps Print) → Print Dialog → (User completes) → Preview Screen (stays)
  │  └─ (User taps Share) → Share Sheet → (User completes) → Main Camera
  └─ (App backgrounded during session) → Exit app (force close)
```

---

## 9. Help Screen Content

**File:** `HelpViewController.swift`

### Screen Title
Implicit (no title displayed; screen is titled "Help View Controller" in storyboard)

### Screen Text
**Displayed Text:**
```
Visit our github to submit new feature requests and bug reports.
```

### Hyperlink
- **Text Fragment:** "github"
- **URL:** https://github.com/csuncodesquadgroup/tinybooth
- **Implementation:** Custom NSAttributedString extension adds link formatting to "github" substring

### Additional Details
- Text is non-editable
- Text color: White
- Background: Dark (UIColor.viewFlipsideBackgroundColor)
- Font: System font, size 17pt
- No other information provided

### Code Reference
- `HelpViewController.swift:23-34` - Text view setup and hyperlink creation
- `HelpViewController.swift:42-54` - `NSAttributedString.makeHyperLink()` extension for link creation

### Missing Information
The help screen does NOT explain:
- How to use the app
- How to print
- How to share
- What the random messages are
- Device requirements
- Privacy information (privacy policy exists but is not linked in-app)

---

## 10. Privacy Policy

**File:** `/tinybooth-old/privacy-policy.md` (Markdown format, ~165 lines)

### Key Data Collection Points

**What Data Is Collected:**
- Mobile device camera access (required for photo capture)
- Possibly device model information (for internal analytics)
- No personal identifiable information (email, name, etc.)

**What Data Is NOT Collected:**
- Photos are NOT uploaded to servers
- No location data collected
- No user accounts or authentication
- No analytics tracking (no third-party trackers mentioned)
- No crash reporting
- No advertising ID collection

**Data Usage:**
- Camera access: "To maintain the security and operation of our App, for troubleshooting and for our internal analytics and reporting purposes"
- Legitimate business interests cited; no specific business uses listed

**Data Retention:**
- "No purpose in this notice will require us keeping your personal information for longer than 90 days"
- Local photos stored indefinitely on device (until app deletion)

**Privacy Notice Details:**
- Issued: June 29, 2020
- Company: codesquad
- Contact: dorkycam@gmail.com
- Jurisdiction considerations for GDPR (EU), Swiss data protection, California (CCPA)

### Important Disclaimers
- "No electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure"
- App does not respond to Do-Not-Track signals
- Policy is based on Termly's Privacy Policy Generator (boilerplate template)

### Policy Not Linked in App
The privacy policy is published at the repository but not accessible from within the app. Only GitHub link in help screen.

---

## 11. Assets

### Logo
**File:** `/assets/logo.png`
**Purpose:** Main TinyBooth brand mark
**Details:** Existing logo that should be modernized but retain spirit/shape language

### App Icons
**Primary Icon Set:** `/assets/tinybooth icons/` (directory with multiple sizes)
- `1024.png` - App Store submission size
- `Icon-60@2x.png`, `Icon-60@3x.png` - iPhone app icon variants
- `Icon-76.png`, `Icon-76@2x.png` - iPad icon
- `Icon-83.5@2x.png` - iPad mini
- `Icon-Small-40.png`, `Icon-Small-40@2x.png`, `Icon-Small-40@3x.png` - Settings/spotlight icon
- `Icon-Notification@2x.png`, `Icon-Notification@3x.png` - Notification icon
- `IconWatch-29@2x.png`, `IconWatch-29@3x.png`, `IconWatch-40@2x.png` - Watch app icon
- `tinbooth-app-icon-01.jpg` - Design source file

**Secondary Icon Set:** `/assets/icons/1024/` (iOS and watchkit variations)

**Audio Assets:**
- `countdownSound_1.mp3` - 3-second countdown tick (played on each tick of 3-second timer)
- `shutterSound.mp3` - Defined but not used (dead code or legacy)

**Xcode Asset Catalog:**
- `/tinybooth/Assets.xcassets/AppIcon.appiconset/` - Standard iOS app icons
- `/tinybooth/Assets.xcassets/AppLogo.imageset/` - Logo image set

### No Design System
No color palette, typography system, or design tokens defined. Raw hex colors and font sizes hardcoded in Swift code.

### Storyboard Assets
Main UI defined in:
- `Main.storyboard` - All three screens (Camera, Preview, Help)
- `LaunchScreen.storyboard` - Launch screen (minimal)

---

## 12. Anything Surprising / Quirks / Dead Code

### Force Exit on Background During Capture
**Location:** `ViewController.swift:381-386`
**Code:**
```swift
@objc func appMovedToBackground() {
    if (sessionInProgress) {
        print("App moved to background")
        exit(0)
    }
}
```
**Behavior:** If user switches apps while a capture session is active (during the 3-second countdown or while taking photos), the app force-terminates itself with `exit(0)`. This prevents partial/corrupted sessions.

**Implication:** User cannot pause and resume a session; any interruption aborts the entire 4-photo sequence.

### Hardcoded 4-Photo Sequence
The number of photos (4) is hardcoded in multiple places and not configurable:
- `ViewController.swift:231` - `var count = 4`
- `ViewController.swift:245` - `if (photosTaken == 4)`

### Device-Specific UI Hacks
Extensive device detection with hardcoded adjustments (ViewController.swift:89-125):
- iPad Air 2: Flash button hidden
- iPhone 8, 7, 6: Button corner radius and border height adjusted
- iPad Pro 12" vs other iPad: Different countdown font sizes and layout
- This suggests UI was tuned for specific devices rather than truly responsive design

### Two Countdown Sound Files
Two countdown sound files exist:
- `countdownSound_1.mp3` - Used in code
- `countdownSound.mp3` - Not referenced in code (possibly legacy)

### Unused Shutter Sound
`shutterSound.mp3` is loaded in `viewDidLoad` but never played. Code initializes the audio player but doesn't trigger it anywhere. Likely dead code from earlier version.

### Preview Image Dismissal Bug (Commented Out)
In `PreviewViewController.swift:49-51`, dismissal after print is commented out:
```swift
// dismisses preview modal - un comment to do it
//        dismiss(animated: true, completion: {
//            self.delegate?.previewDismissed()
//        })
```
This means users stay on the preview screen after printing. The button is still tappable for multiple prints, but normal UX would be to dismiss.

### Landscape Support Missing
`Info.plist` only supports portrait orientation:
```xml
<key>UISupportedInterfaceOrientations</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
    <string>UIInterfaceOrientationPortrait</string>
</array>
```
App does not rotate; locked to portrait even on iPad (which is surprising for a photobooth app that might be displayed in landscape on a stand).

### No Persistence Layer
Core Data is configured in AppDelegate but completely unused. The `tinybooth.xcdatamodeld` file is empty (no entities defined). All data is transient (exists only during current session).

### Typos in Comments
Several minor typos in code comments (inconsequential but noted):
- `ViewController.swift:152` - "necesary" should be "necessary"
- `ViewController.swift:14-18` - Comment formatting inconsistencies

### No Error Handling
Photo capture and file I/O have minimal error handling:
- `PhotoUtil.swift:71-72` - `try?` silently fails if JPEG encoding fails
- `PreviewViewController.swift:65-68` - Catches write-to-disk errors but only prints log
- No user feedback if photo capture fails

### Sensitive Design Choice: Exit on Background
The force `exit(0)` during capture is aggressive but intentional. In a photobooth context, a session should not be pausable. This makes sense for a kiosk device but might surprise users on personal phones.

---

## Summary Table

| Feature | Status | Notes |
|---------|--------|-------|
| Platform | iOS only | Swift/UIKit, iOS 13+ |
| Camera | AVFoundation | Front-facing only, full resolution |
| Capture Flow | 3-second countdown, 4 photos | Hardcoded, not configurable |
| Layout | 1x4 vertical strip | 800x1200px output, fixed design |
| Watermark | None | No logo/branding on photostrip |
| Print | AirPrint (UIPrintInteractionController) | Any AirPrint-compatible printer |
| Sharing | iOS share sheet | UIActivityViewController |
| Storage | Local device only | Documents directory, no cloud |
| Messages | 9 hardcoded | Random selection after each photo |
| Settings | Flash toggle only | No other customization |
| Screens | 3 (Camera, Preview, Help) | Storyboard-based UI |
| Help | Minimal (1 line + GitHub link) | Not detailed; privacy policy not linked |
| Privacy | Policy exists externally | No in-app data collection (camera only) |
| Quirks | Force exit on background | Prevents paused sessions |
| Dead Code | Shutter sound, unused storyboards | Minor legacy artifacts |
| Responsive Design | Device-specific hacks | Not truly adaptive; tablet-first lacking |
| Landscape | Not supported | Portrait only, even on iPad |
| Persistence | No Core Data usage | All transient data |

---

## Recommendations for New App Build

1. **Preserve Bundle ID:** Keep `com.codesquad.tinybooth` for seamless App Store update
2. **Extend Message Library:** The 9 messages are perfect starting point; plan for user customization at paid tier
3. **Multiple Layouts:** Current single layout is a feature, not a limitation; add 2x2, 1x3, single-photo options in new app
4. **Tablet-First Design:** Current app has device-specific hacks; new cross-platform design must handle landscape properly
5. **Watermark/Logo:** Current app has none; new design should support removable watermark (monetization lever)
6. **Print Improvements:** Current AirPrint works well; consider email/SMS delivery at paid tier (cost implications)
7. **Landscape Support:** Essential for iPad use in landscape orientation at events
8. **Error Handling:** Add user feedback for capture/save failures
9. **Settings:** Preserve simplicity; only expose essential toggles (flash, maybe theme)
10. **Help Content:** Expand with actual tutorial/how-to content, not just a GitHub link


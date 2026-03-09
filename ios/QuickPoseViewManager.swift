import Foundation

@objc(QuickPoseViewManager)
class QuickPoseViewManager: RCTViewManager {
  override func view() -> UIView! {
    return QuickPoseView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

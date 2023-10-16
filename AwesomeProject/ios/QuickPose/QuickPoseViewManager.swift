import Foundation

@objc(QuickPoseViewManager)
class QuickPoseViewManager: RCTViewManager {
  override func view() -> UIView! {
    return QuickPoseView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc func updateFromManager(_ node: NSNumber) {
    DispatchQueue.main.async {
      let component = self.bridge.uiManager.view(forReactTag: node) as! QuickPoseView
      component.update()
    }
  }
}

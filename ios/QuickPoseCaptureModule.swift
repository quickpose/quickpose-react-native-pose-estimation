import Foundation
import React
import UIKit

@objc(QuickPoseCaptureModule)
class QuickPoseCaptureModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc var bridge: RCTBridge!

  @objc func methodQueue() -> DispatchQueue { DispatchQueue.main }

  @objc(captureFrame:resolver:rejecter:)
  func captureFrame(_ viewTag: NSNumber,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        let path = try self.captureToFile(viewTag: viewTag)
        resolve("file://\(path)")
      } catch {
        reject("capture_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(shareFrame:title:resolver:rejecter:)
  func shareFrame(_ viewTag: NSNumber,
                  title: NSString?,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      do {
        let path = try self.captureToFile(viewTag: viewTag)
        let url = URL(fileURLWithPath: path)
        let activity = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let t = title as String? { activity.title = t }
        guard let root = UIApplication.shared.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
          reject("share_failed", "No root view controller", nil)
          return
        }
        var presenter = root
        while let presented = presenter.presentedViewController { presenter = presented }
        if let pop = activity.popoverPresentationController {
          pop.sourceView = presenter.view
          pop.sourceRect = CGRect(x: presenter.view.bounds.midX, y: presenter.view.bounds.midY, width: 0, height: 0)
          pop.permittedArrowDirections = []
        }
        presenter.present(activity, animated: true) {
          resolve(nil)
        }
      } catch {
        reject("share_failed", error.localizedDescription, error)
      }
    }
  }

  private func captureToFile(viewTag: NSNumber) throws -> String {
    guard let view = QuickPoseView.registry[viewTag.intValue] else {
      throw NSError(domain: "QuickPose", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not resolve QuickPoseView for tag \(viewTag)"])
    }
    guard let image = view.latestFrameImage, let data = image.pngData() else {
      throw NSError(domain: "QuickPose", code: 2, userInfo: [NSLocalizedDescriptionKey: "No frame available yet — wait a moment after mounting"])
    }
    let tmpDir = NSTemporaryDirectory()
    let path = (tmpDir as NSString).appendingPathComponent("quickpose_\(Int(Date().timeIntervalSince1970 * 1000)).png")
    try data.write(to: URL(fileURLWithPath: path))
    return path
  }
}

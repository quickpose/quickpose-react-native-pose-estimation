import SwiftUI
import UIKit
import QuickPoseCore
import QuickPoseSwiftUI

private class OverlayState: ObservableObject {
  @Published var image: UIImage?
}

private struct QuickPoseCameraWrapperView: View {
  let quickPose: QuickPose
  let useFrontCamera: Bool
  @ObservedObject var overlayState: OverlayState

  var body: some View {
    ZStack {
      if ProcessInfo.processInfo.isiOSAppOnMac, let url = Bundle.main.url(forResource: "happy-dance", withExtension: "mov") {
        QuickPoseSimulatedCameraView(useFrontCamera: useFrontCamera, delegate: quickPose, video: url)
      } else {
        QuickPoseCameraView(useFrontCamera: useFrontCamera, delegate: quickPose)
      }
      QuickPoseOverlayView(overlayImage: $overlayState.image)
    }
    .edgesIgnoringSafeArea(.all)
  }
}

class QuickPoseView: UIView {

  @objc var onUpdate: RCTDirectEventBlock?

  @objc var sdkKey: String = "" {
    didSet { tryStart() }
  }

  @objc var features: [String] = [] {
    didSet { updateFeatures() }
  }

  @objc var useFrontCamera: Bool = true {
    didSet { tryStart() }
  }

  private var quickPose: QuickPose?
  private var hostingController: UIHostingController<QuickPoseCameraWrapperView>?
  private var overlayState = OverlayState()
  private var hasStarted = false

  override init(frame: CGRect) {
    super.init(frame: frame)
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func updateFeatures() {
    guard hasStarted, let qp = quickPose else {
      tryStart()
      return
    }
    let parsed = features.compactMap { QuickPoseBasicView.parseFeature($0) }
    guard !parsed.isEmpty else { return }
    qp.update(features: parsed)
  }

  private func tryStart() {
    guard !sdkKey.isEmpty, !features.isEmpty, !hasStarted else { return }
    hasStarted = true

    let qp = QuickPose(sdkKey: sdkKey)
    quickPose = qp

    let parsedFeatures = features.compactMap { QuickPoseBasicView.parseFeature($0) }
    guard !parsedFeatures.isEmpty else { return }

    let wrapperView = QuickPoseCameraWrapperView(
      quickPose: qp,
      useFrontCamera: useFrontCamera,
      overlayState: overlayState
    )

    let vc = UIHostingController(rootView: wrapperView)
    let swiftuiView = vc.view!
    swiftuiView.translatesAutoresizingMaskIntoConstraints = false

    addSubview(swiftuiView)
    NSLayoutConstraint.activate([
      swiftuiView.leadingAnchor.constraint(equalTo: self.leadingAnchor),
      swiftuiView.trailingAnchor.constraint(equalTo: self.trailingAnchor),
      swiftuiView.topAnchor.constraint(equalTo: self.topAnchor),
      swiftuiView.bottomAnchor.constraint(equalTo: self.bottomAnchor),
    ])

    hostingController = vc

    qp.start(features: parsedFeatures, onFrame: { [weak self] status, image, featureResults, feedback, landmarks in
      self?.overlayState.image = image
      if case .success = status {
        guard let self = self, let onUpdate = self.onUpdate else { return }
        let currentFeatures = self.features
        var results: [(String, Double)] = []
        for (i, featureString) in currentFeatures.enumerated() {
          if i < featureResults.count {
            let entry = featureResults[featureResults.index(featureResults.startIndex, offsetBy: i)]
            results.append((featureString, entry.value.value))
          }
        }
        let resultArray = results.map { ["feature": $0.0, "value": $0.1] as [String: Any] }
        let jsonData = (try? JSONSerialization.data(withJSONObject: resultArray)) ?? Data()
        let resultsJson = String(data: jsonData, encoding: .utf8) ?? "[]"
        let feedbackText = feedback.values.first?.displayString ?? ""
        onUpdate(["resultsJson": resultsJson, "feedback": feedbackText])
      }
    })
  }

  override func removeFromSuperview() {
    quickPose?.stop()
    quickPose = nil
    hostingController?.view.removeFromSuperview()
    hostingController = nil
    hasStarted = false
    super.removeFromSuperview()
  }
}

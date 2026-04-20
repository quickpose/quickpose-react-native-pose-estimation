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

  @objc var features: NSArray = [] {
    didSet { updateFeatures() }
  }

  @objc var useFrontCamera: Bool = true {
    didSet { tryStart() }
  }

  private var quickPose: QuickPose?
  private var hostingController: UIHostingController<QuickPoseCameraWrapperView>?
  private var overlayState = OverlayState()
  private var hasStarted = false
  // Feature keys from JS, kept in order for result correlation
  private var currentFeatures: [(String, QuickPose.Feature)] = []
  private var currentFeatureKeys: [String] { currentFeatures.map { $0.0 } }

  // Registry so QuickPoseCaptureModule can find the view by reactTag on
  // both Paper and Fabric — Fabric's UIManager doesn't expose view registry.
  static var registry: [Int: QuickPoseView] = [:]

  override var reactTag: NSNumber! {
    didSet {
      if let old = oldValue?.intValue { QuickPoseView.registry.removeValue(forKey: old) }
      if let tag = reactTag?.intValue { QuickPoseView.registry[tag] = self }
    }
  }

  deinit {
    if let tag = reactTag?.intValue { QuickPoseView.registry.removeValue(forKey: tag) }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // MARK: - Feature dict → SDK Feature mapping

  private func mapFeatures() -> [(String, QuickPose.Feature)] {
    guard let dicts = features as? [[String: Any]] else { return [] }
    return dicts.compactMap { dict in
      guard let key = dict["featureKey"] as? String,
            let feature = mapFeature(dict)
      else { return nil }
      return (key, feature)
    }
  }

  private func mapFeature(_ dict: [String: Any]) -> QuickPose.Feature? {
    guard let type = dict["type"] as? String else { return nil }
    let style = (dict["style"] as? [String: Any]).map { Self.parseStyle(from: $0) } ?? QuickPose.Style()

    switch type {
    case "overlay":
      guard let group = groupForName(dict["group"] as? String, side: sideForName(dict["side"] as? String)) else { return nil }
      return .overlay(group, style: style)

    case "showPoints":
      return .showPoints(style: style)

    case "rangeOfMotion":
      guard let rom = romForDict(dict) else { return nil }
      return .rangeOfMotion(rom, style: style)

    case "fitness":
      guard let fit = fitnessForDict(dict) else { return nil }
      return .fitness(fit, style: style)

    case "raisedFingers":
      return .raisedFingers(side: sideForName(dict["side"] as? String), style: style)

    case "thumbsUp":
      return .thumbsUp(side: sideForName(dict["side"] as? String), style: style)

    case "thumbsUpOrDown":
      return .thumbsUpOrDown(side: sideForName(dict["side"] as? String), style: style)

    case "inside":
      let group = groupForName(dict["group"] as? String, side: nil) ?? .wholeBodyAndHead
      let insets = insetsForDict(dict["edgeInsets"] as? [String: Any])
      return .inside(insets, limb: group, style: style)

    case "overlayHasCameraAsBackground":
      let darken = Float(dict["darkenCamera"] as? Double ?? 0)
      return .overlayHasCameraAsBackground(darkenCamera: darken)

    default:
      return nil
    }
  }

  // MARK: - Style parsing

  static func parseStyle(from dict: [String: Any]) -> QuickPose.Style {
    let color: UIColor = {
      if let hex = dict["color"] as? String {
        return UIColor.fromHex(hex) ?? .white
      }
      return .white
    }()

    let hidden = dict["hidden"] as? Bool ?? false
    let relativeFontSize = dict["relativeFontSize"] as? Double ?? 1.0
    let relativeArcSize = dict["relativeArcSize"] as? Double ?? 1.0
    let relativeLineWidth = dict["relativeLineWidth"] as? Double ?? 1.0
    let cornerRadius = dict["cornerRadius"] as? Double ?? 0.0

    var conditionalColors: [QuickPose.Style.ConditionalColor]? = nil
    if let ccArray = dict["conditionalColors"] as? [[String: Any]] {
      conditionalColors = ccArray.compactMap { cc in
        guard let colorHex = cc["color"] as? String,
              let ccColor = UIColor.fromHex(colorHex) else { return nil }
        let min = cc["min"] as? Double
        let max = cc["max"] as? Double
        return QuickPose.Style.ConditionalColor(min: min, max: max, color: ccColor)
      }
    }

    return QuickPose.Style(
      hidden: hidden,
      relativeFontSize: relativeFontSize,
      relativeArcSize: relativeArcSize,
      relativeLineWidth: relativeLineWidth,
      cornerRadius: cornerRadius,
      color: color,
      conditionalColors: conditionalColors
    )
  }

  // MARK: - Identifier → SDK enum lookups

  private func sideForName(_ name: String?) -> QuickPose.Side? {
    switch name {
    case "left": return .left
    case "right": return .right
    default: return nil
    }
  }

  private func groupForName(_ name: String?, side: QuickPose.Side?) -> QuickPose.Landmarks.Group? {
    switch name {
    case "wholeBody": return .wholeBody
    case "wholeBodyAndHead": return .wholeBodyAndHead
    case "upperBody": return .upperBody
    case "straightArmsUpperBody": return .straightArmsUpperBody
    case "toWristsUpperBody": return .toWristsUpperBody
    case "shoulders": return .shoulders
    case "arm": return .arm(side: side ?? .left)
    case "armToWrist": return .armToWrist(side: side ?? .left)
    case "armNoElbow": return .armNoElbow(side: side ?? .left)
    case "straightArm": return .straightArm(side: side ?? .left)
    case "hand": return .hand(side: side ?? .left)
    case "leg": return .leg(side: side ?? .left)
    case "lowerBody": return .lowerBody
    case "hips": return .hips
    case "elbows": return .elbows
    case "knees": return .knees
    case "legs": return .legs
    case "arms": return .arms
    case "head": return .head
    default: return nil
    }
  }

  private func romForDict(_ dict: [String: Any]) -> QuickPose.RangeOfMotion? {
    guard let joint = dict["joint"] as? String else { return nil }
    let clockwise = dict["clockwise"] as? Bool ?? false
    let side = sideForName(dict["side"] as? String)

    switch joint {
    case "neck": return .neck(clockwiseDirection: clockwise)
    case "shoulder": return .shoulder(side: side ?? .left, clockwiseDirection: clockwise)
    case "elbow": return .elbow(side: side ?? .left, clockwiseDirection: clockwise)
    case "hip": return .hip(side: side ?? .left, clockwiseDirection: clockwise)
    case "back": return .back(clockwiseDirection: clockwise)
    case "knee": return .knee(side: side ?? .left, clockwiseDirection: clockwise)
    case "ankle": return .ankle(side: side ?? .left, clockwiseDirection: clockwise)
    default: return nil
    }
  }

  private func fitnessForDict(_ dict: [String: Any]) -> QuickPose.FitnessFeature? {
    guard let exercise = dict["exercise"] as? String else { return nil }
    let side = sideForName(dict["side"] as? String)

    switch exercise {
    case "squats": return .squats
    case "pushUps": return .pushUps
    case "jumpingJacks": return .jumpingJacks
    case "sumoSquats": return .sumoSquats
    case "lunges": return .lunges(side: side ?? .left)
    case "sitUps": return .sitUps
    case "cobraWings": return .cobraWings
    case "plank": return .plank
    case "plankStraightArm": return .plankStraightArm
    case "legRaises": return .legRaises
    case "gluteBridge": return .gluteBridge
    case "overheadDumbbellPress": return .overheadDumbbellPress
    case "vUps": return .vUps
    case "lateralRaises": return .lateralRaises
    case "frontRaises": return .frontRaises
    case "hipAbductionStanding": return .hipAbductionStanding(side: side ?? .left)
    case "sideLunges": return .sideLunges(side: side ?? .left)
    case "bicepCurls": return .bicepCurls
    case "bicepCurlsSingleArm": return .bicepCurlsSingleArm(side: side ?? .left)
    default: return nil
    }
  }

  private func insetsForDict(_ dict: [String: Any]?) -> QuickPose.RelativeCameraEdgeInsets {
    guard let ei = dict else {
      return QuickPose.RelativeCameraEdgeInsets(top: 0.1, left: 0.1, bottom: 0.1, right: 0.1)
    }
    let top = CGFloat(ei["top"] as? Double ?? 0.1)
    let left = CGFloat(ei["left"] as? Double ?? 0.1)
    let bottom = CGFloat(ei["bottom"] as? Double ?? 0.1)
    let right = CGFloat(ei["right"] as? Double ?? 0.1)
    return QuickPose.RelativeCameraEdgeInsets(top: top, left: left, bottom: bottom, right: right)
  }

  // MARK: - Lifecycle

  private func updateFeatures() {
    guard hasStarted, let qp = quickPose else {
      tryStart()
      return
    }
    let keyedFeatures = mapFeatures()
    guard !keyedFeatures.isEmpty else { return }
    currentFeatures = keyedFeatures
    qp.update(features: keyedFeatures.map { $0.1 })
  }

  func captureFrame() -> UIImage? {
    guard let camera = quickPose?.latestCameraImage else { return nil }
    let overlay = overlayState.image
    let size = camera.size
    let bounds = CGRect(origin: .zero, size: size)
    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { _ in
      camera.draw(in: bounds)
      overlay?.draw(in: bounds)
    }
  }

  private func tryStart() {
    guard !sdkKey.isEmpty, features.count > 0, !hasStarted else { return }
    hasStarted = true

    let qp = QuickPose(sdkKey: sdkKey)
    quickPose = qp

    let keyedFeatures = mapFeatures()
    guard !keyedFeatures.isEmpty else { return }
    currentFeatures = keyedFeatures
    let parsedFeatures = keyedFeatures.map { $0.1 }

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
      var fps: Int = 0
      switch status {
      case .success(let info): fps = info.fps
      case .noPersonFound(let info): fps = info.fps
      case .sdkValidationError: fps = 0
      }
      if case .success = status {
        guard let self = self, let onUpdate = self.onUpdate else { return }
        var results: [String: Double] = [:]
        var feedbacks: [String: String] = [:]
        for (featureKey, feature) in self.currentFeatures {
          if let result = featureResults[feature] {
            results[featureKey] = result.value
          }
          if let fb = feedback[feature]?.displayString, !fb.isEmpty {
            feedbacks[featureKey] = fb
          }
        }
        let resultsJson = (try? JSONSerialization.data(withJSONObject: results)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        let feedbacksJson = (try? JSONSerialization.data(withJSONObject: feedbacks)).flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        onUpdate(["resultsJson": resultsJson, "feedbacksJson": feedbacksJson, "fps": fps])
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

extension UIColor {
  static func fromHex(_ hex: String) -> UIColor? {
    var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

    var rgb: UInt64 = 0
    guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }

    switch hexSanitized.count {
    case 6:
      return UIColor(
        red: CGFloat((rgb & 0xFF0000) >> 16) / 255.0,
        green: CGFloat((rgb & 0x00FF00) >> 8) / 255.0,
        blue: CGFloat(rgb & 0x0000FF) / 255.0,
        alpha: 1.0
      )
    case 8:
      return UIColor(
        red: CGFloat((rgb & 0xFF000000) >> 24) / 255.0,
        green: CGFloat((rgb & 0x00FF0000) >> 16) / 255.0,
        blue: CGFloat((rgb & 0x0000FF00) >> 8) / 255.0,
        alpha: CGFloat(rgb & 0x000000FF) / 255.0
      )
    default:
      return nil
    }
  }
}

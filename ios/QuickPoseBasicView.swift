import SwiftUI
import QuickPoseCore
import QuickPoseSwiftUI

struct QuickPoseBasicView: View {

  let sdkKey: String
  let featureStrings: [String]
  let useFrontCamera: Bool
  let onResult: ([(String, Double)], String?) -> Void

  @State private var overlayImage: UIImage?
  @State private var quickPose: QuickPose?

  var body: some View {
    GeometryReader { geometry in
      ZStack(alignment: .top) {
        if let qp = quickPose {
          if ProcessInfo.processInfo.isiOSAppOnMac, let url = Bundle.main.url(forResource: "happy-dance", withExtension: "mov") {
            QuickPoseSimulatedCameraView(useFrontCamera: useFrontCamera, delegate: qp, video: url)
          } else {
            QuickPoseCameraView(useFrontCamera: useFrontCamera, delegate: qp)
          }
          QuickPoseOverlayView(overlayImage: $overlayImage)
        }
      }
      .frame(width: geometry.size.width)
      .edgesIgnoringSafeArea(.all)
      .onAppear {
        let qp = QuickPose(sdkKey: sdkKey)
        quickPose = qp

        let features = featureStrings.compactMap { QuickPoseBasicView.parseFeature($0) }
        guard !features.isEmpty else { return }

        qp.start(features: features, onFrame: { status, image, featureResults, feedback, landmarks in
          overlayImage = image
          if case .success = status {
            var results: [(String, Double)] = []
            for (i, featureString) in featureStrings.enumerated() {
              if i < featureResults.count {
                let entry = featureResults[featureResults.index(featureResults.startIndex, offsetBy: i)]
                results.append((featureString, entry.value.value))
              }
            }
            let feedbackText = feedback.values.first?.displayString
            onResult(results, feedbackText)
          }
        })
      }
      .onDisappear {
        quickPose?.stop()
      }
    }
  }

  static func parseFeature(_ string: String) -> QuickPose.Feature? {
    let parts = string.split(separator: ".").map(String.init)
    guard let category = parts.first else { return nil }

    switch category {
    case "overlay":
      guard let group = parseLandmarksGroup(Array(parts.dropFirst())) else { return nil }
      return .overlay(group)

    case "showPoints":
      return .showPoints()

    case "rangeOfMotion":
      guard let rom = parseRangeOfMotion(Array(parts.dropFirst())) else { return nil }
      return .rangeOfMotion(rom)

    case "fitness":
      guard let fitness = parseFitnessFeature(Array(parts.dropFirst())) else { return nil }
      return .fitness(fitness)

    case "raisedFingers":
      let side = parts.count > 1 ? parseSide(parts[1]) : nil
      return .raisedFingers(side: side)

    case "thumbsUp":
      let side = parts.count > 1 ? parseSide(parts[1]) : nil
      return .thumbsUp(side: side)

    case "thumbsUpOrDown":
      let side = parts.count > 1 ? parseSide(parts[1]) : nil
      return .thumbsUpOrDown(side: side)

    default:
      return nil
    }
  }

  static func parseLandmarksGroup(_ parts: [String]) -> QuickPose.Landmarks.Group? {
    guard let name = parts.first else { return nil }
    let side = parts.count > 1 ? parseSide(parts[1]) : nil

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

  static func parseRangeOfMotion(_ parts: [String]) -> QuickPose.RangeOfMotion? {
    guard let name = parts.first else { return nil }
    let side = parts.count > 1 ? parseSide(parts[1]) : nil

    switch name {
    case "neck": return .neck(clockwiseDirection: false)
    case "shoulder": return .shoulder(side: side ?? .left, clockwiseDirection: false)
    case "elbow": return .elbow(side: side ?? .left, clockwiseDirection: false)
    case "hip": return .hip(side: side ?? .left, clockwiseDirection: false)
    case "back": return .back(clockwiseDirection: false)
    case "knee": return .knee(side: side ?? .left, clockwiseDirection: false)
    case "ankle": return .ankle(side: side ?? .left, clockwiseDirection: false)
    default: return nil
    }
  }

  static func parseFitnessFeature(_ parts: [String]) -> QuickPose.FitnessFeature? {
    guard let name = parts.first else { return nil }
    let side = parts.count > 1 ? parseSide(parts[1]) : nil

    switch name {
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

  static func parseSide(_ string: String) -> QuickPose.Side? {
    switch string {
    case "left": return .left
    case "right": return .right
    default: return nil
    }
  }
}

//
//  QuickPose_BasicDemoApp.swift
//  QuickPose Demo
//
//  Created by QuickPose.ai on 12/12/2022.
//

import SwiftUI
import QuickPoseCore
import QuickPoseSwiftUI

struct QuickPoseBasicView: View {
  
  public let onNewAngle: ((Double) -> ())
  private var quickPose = QuickPose(sdkKey: "YOUR SDK KEY HERE") // register for your free key at https://dev.quickpose.ai
  @State private var overlayImage: UIImage?
  
  init(onNewAngle: @escaping (Double) -> Void) {
    self.onNewAngle = onNewAngle
  }
  
  var body: some View {
      GeometryReader { geometry in
          ZStack(alignment: .top) {
              if ProcessInfo.processInfo.isiOSAppOnMac, let url = Bundle.main.url(forResource: "happy-dance", withExtension: "mov") {
                  QuickPoseSimulatedCameraView(useFrontCamera: true, delegate: quickPose, video: url)
              } else {
                  QuickPoseCameraView(useFrontCamera: true, delegate: quickPose)
              }
              QuickPoseOverlayView(overlayImage: $overlayImage)
          }
          .frame(width: geometry.size.width)
          .edgesIgnoringSafeArea(.all)
          .onAppear {
            quickPose.start(features: [.rangeOfMotion(.shoulder(side: .left, clockwiseDirection: false))], onFrame: { status, image, features, feedback, landmarks in
                  overlayImage = image
                  if case .success = status {
                    onNewAngle(features.first!.value.value)
                  } else {
                      // show error feedback
                  }
              })
          }.onDisappear {
              quickPose.stop()
          }
      }
  }
}


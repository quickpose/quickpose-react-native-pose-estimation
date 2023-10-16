import SwiftUI
import UIKit

class QuickPoseView: UIView {

  @objc var onUpdate: RCTDirectEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)
    let qpView = QuickPoseBasicView(onNewAngle: { angle in
      if self.onUpdate != nil {
        self.onUpdate!(["angle": angle])
      }
    })
    
    let vc = UIHostingController(rootView: qpView)
    
    self.backgroundColor = UIColor.red
    let swiftuiView = vc.view!
    swiftuiView.translatesAutoresizingMaskIntoConstraints = false
    
    addSubview(swiftuiView)
      NSLayoutConstraint.activate([
        swiftuiView.centerXAnchor.constraint(equalTo: self.centerXAnchor),
        swiftuiView.centerYAnchor.constraint(equalTo: self.centerYAnchor),
        swiftuiView.widthAnchor.constraint(equalTo: self.widthAnchor),
        swiftuiView.heightAnchor.constraint(equalTo: self.heightAnchor),
      ])
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  @objc func update() {
    
  }
}

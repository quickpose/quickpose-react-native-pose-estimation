require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "quickpose-react-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => "15.0" }
  s.source       = { :git => package["repository"], :tag => s.version }
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  install_modules_dependencies(s)
  s.dependency "QuickPoseCore"
  s.dependency "QuickPoseCamera"
  s.dependency "QuickPoseSwiftUI"
end

require "xcodeproj"

project = Xcodeproj::Project.new("FillMyMapUITests.xcodeproj")
target = project.new_target(:ui_test_bundle, "FillMyMapUITests", :ios, "17.0")
source = project.main_group.new_file("FillMyMapUITests.swift")
target.source_build_phase.add_file_reference(source)
target.build_configurations.each do |config|
  config.build_settings["CODE_SIGNING_ALLOWED"] = "NO"
  config.build_settings["GENERATE_INFOPLIST_FILE"] = "YES"
  config.build_settings["PRODUCT_BUNDLE_IDENTIFIER"] = "app.fillmymap.uitests"
  config.build_settings["SWIFT_VERSION"] = "5.0"
  config.build_settings["TARGETED_DEVICE_FAMILY"] = "1"
end
scheme = Xcodeproj::XCScheme.new
scheme.add_test_target(target)
scheme.save_as(project.path, "FillMyMapUITests", true)
project.save

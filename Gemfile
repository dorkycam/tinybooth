source "https://rubygems.org"

# Pin Fastlane to a known-good 2.x line. Bumping this requires a
# `bundle update fastlane` and a fresh checkout against an Apple Dev account
# that can run `fastlane snapshot` end-to-end.
gem "fastlane", "~> 2.227"

# fastlane-plugin-versioning lets us bump CFBundleShortVersionString without
# committing the change back to git from CI.
plugins_path = File.join(File.dirname(__FILE__), "fastlane", "Pluginfile")
eval_gemfile(plugins_path) if File.exist?(plugins_path)

#!/bin/bash
# Post-install patches for glog configure issues in React Native.
# Called via "postinstall" in each example's package.json.

set -e
DIR="${INIT_CWD:-$PWD}"
RN_DIR="$DIR/node_modules/react-native"
GLOG_SCRIPT="$RN_DIR/scripts/ios-configure-glog.sh"

# Fix 1 (RN 0.72): Inline CC with spaces-in-path → use cc_wrapper approach
if grep -q 'export CC="$(xcrun -find' "$GLOG_SCRIPT" 2>/dev/null; then
  sed -i '' '/^[[:space:]]*export CC="\$(xcrun -find/,/^[[:space:]]*export CXX="\$CC"/c\
  CC_BIN="$(xcrun -find -sdk $PLATFORM_NAME cc)"\
  SDK_PATH="$(xcrun -sdk $PLATFORM_NAME --show-sdk-path)"\
  cat > /tmp/cc_wrapper.sh <<WRAPPER\
#!/bin/bash\
exec "$CC_BIN" -arch $CURRENT_ARCH -isysroot "$SDK_PATH" "\\$@"\
WRAPPER\
  chmod +x /tmp/cc_wrapper.sh\
  export CC="/tmp/cc_wrapper.sh"\
  export CXX="$CC"' "$GLOG_SCRIPT"
  echo "  Patched ios-configure-glog.sh (spaces-in-path fix)"
fi

# Fix 2 (RN 0.75/0.76): CXX line outside if/else uses wrong syntax ($CXX:-$CC
# instead of ${CXX:-$CC}), corrupting CXX to "/tmp/cc_wrapper.sh:-/tmp/cc_wrapper.sh"
if grep -q 'export CXX="\$CXX:-\$CC"' "$GLOG_SCRIPT" 2>/dev/null; then
  sed -i '' 's|export CXX="\$CXX:-\$CC"|export CXX="\${CXX:-\$CC}"|' "$GLOG_SCRIPT"
  echo "  Patched ios-configure-glog.sh (CXX parameter expansion fix)"
fi

echo "Post-install patches applied."

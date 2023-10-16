#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(QuickPoseViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onUpdate, RCTDirectEventBlock)
RCT_EXTERN_METHOD(updateFromManager:(nonnull NSNumber *)node)

@end

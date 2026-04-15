#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(QuickPoseViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(onUpdate, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(sdkKey, NSString)
RCT_EXPORT_VIEW_PROPERTY(features, NSArray)
RCT_EXPORT_VIEW_PROPERTY(useFrontCamera, BOOL)

@end

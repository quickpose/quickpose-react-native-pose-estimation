#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(QuickPoseCaptureModule, NSObject)

RCT_EXTERN_METHOD(captureFrame:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(shareFrame:(nonnull NSNumber *)viewTag
                  title:(NSString *)title
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

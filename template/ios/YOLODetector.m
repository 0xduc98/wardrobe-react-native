//
//  YOLODetector.m
//  YOLOv8n Fashion Detector - Objective-C Bridge
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(YOLODetector, NSObject)

RCT_EXTERN_METHOD(detectGarment:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end

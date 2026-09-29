#import <Foundation/Foundation.h>
#import <NetworkExtension/NetworkExtension.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^ConfigurationUDPReadCompletion)(NSArray<NSData *> * _Nullable datagrams, NSArray * _Nullable flowEndpoints, NSError * _Nullable error);
typedef void (^ConfigurationUDPWriteCompletion)(NSError * _Nullable error);

@interface ConfigurationNetworkExtensionShim : NSObject
- (void)readDatagramsFromFlow:(NEAppProxyUDPFlow *)flow completion:(ConfigurationUDPReadCompletion)completion;
- (void)writeDatagrams:(NSArray<NSData *> *)datagrams
         flowEndpoints:(NSArray *)flowEndpoints
              toFlow:(NEAppProxyUDPFlow *)flow
          completion:(ConfigurationUDPWriteCompletion)completion;
@end

NS_ASSUME_NONNULL_END

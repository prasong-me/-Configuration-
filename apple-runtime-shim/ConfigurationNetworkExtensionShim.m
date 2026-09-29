#import "ConfigurationNetworkExtensionShim.h"

@implementation ConfigurationNetworkExtensionShim

- (void)readDatagramsFromFlow:(NEAppProxyUDPFlow *)flow completion:(ConfigurationUDPReadCompletion)completion {
    [flow readDatagramsAndFlowEndpointsWithCompletionHandler:^(NSArray<NSData *> *datagrams, NWEndpointArray *flowEndpoints, NSError *error) {
        completion(datagrams, (NSArray *)flowEndpoints, error);
    }];
}

- (void)writeDatagrams:(NSArray<NSData *> *)datagrams
         flowEndpoints:(NSArray *)flowEndpoints
                toFlow:(NEAppProxyUDPFlow *)flow
            completion:(ConfigurationUDPWriteCompletion)completion {
    [flow writeDatagrams:datagrams
  sentByFlowEndpoints:(NWEndpointArray *)flowEndpoints
       completionHandler:completion];
}

@end

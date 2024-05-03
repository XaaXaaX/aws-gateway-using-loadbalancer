#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsGatewayUsingLoadbalancerStack } from '../lib/aws-gateway-using-loadbalancer-stack';

const app = new cdk.App();
new AwsGatewayUsingLoadbalancerStack(app, 'AwsGatewayUsingLoadbalancerStack', {
});
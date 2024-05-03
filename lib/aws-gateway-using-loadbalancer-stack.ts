import * as cdk from 'aws-cdk-lib';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { ApplicationListener, ApplicationTargetGroup, ListenerCondition } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { LambdaTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Architecture, HttpMethod, LoggingFormat, Runtime } from 'aws-cdk-lib/aws-lambda';
import { BundlingOptions, NodejsFunction, NodejsFunctionProps, OutputFormat, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { join } from 'path';

export const EsbuildNodeBundling: BundlingOptions = {
  platform: 'node',
  format: OutputFormat.ESM,
  mainFields: ['module', 'main'],
  minify: true,
  sourceMap: true,
  sourcesContent: false,
  sourceMapMode: SourceMapMode.INLINE,
  externalModules: [ '@aws-sdk' ],
}

export const LambdaConfiguration: NodejsFunctionProps = {
  runtime: Runtime.NODEJS_20_X,
  architecture: Architecture.ARM_64,
  loggingFormat: LoggingFormat.JSON,
  memorySize: 256,
  timeout: cdk.Duration.seconds(30),
  systemLogLevel: 'INFO',
  applicationLogLevel: 'INFO',
  awsSdkConnectionReuse: false,
  bundling: EsbuildNodeBundling,
}

export class AwsGatewayUsingLoadbalancerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const albSecurityGroupId = StringParameter.fromStringParameterName(this, 'https-listener-securitygroupe-id', '/alb/securityGroupId').stringValue;
    const albHttpsListenerArn = StringParameter.fromStringParameterName(this, 'https-listener-arn',  '/alb/httpsListenerArn').stringValue;
    const securityGroup = SecurityGroup.fromSecurityGroupId(this, 'alb-security-group', albSecurityGroupId);

    const albListener = ApplicationListener.fromApplicationListenerAttributes(this, 'alb-listener', {
      listenerArn: albHttpsListenerArn,
      securityGroup: securityGroup,
    });

    const lambda = new NodejsFunction(this, 'example-lambda', {
      entry: join(process.cwd(), '/src/example.ts'),
      handler: 'handler',
      ...LambdaConfiguration
    });

    const target = new ApplicationTargetGroup(this, 'example-target-group', { targets: [ new LambdaTarget(lambda) ] });

    albListener.addTargetGroups('dosomething-target', {
      priority: 1,
      conditions: [
        ListenerCondition.hostHeaders(['myservice.example.com']),
        ListenerCondition.pathPatterns(['/v1/dosomthing']),
        ListenerCondition.httpRequestMethods([
          HttpMethod.POST,
          HttpMethod.OPTIONS,
        ]),
      ],
      targetGroups: [target],
    });
  }
}

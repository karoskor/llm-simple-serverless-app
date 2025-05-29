import { Construct } from 'constructs';
import { aws_lambda as lambda, aws_apigateway as apigateway, Duration, aws_iam as iam, aws_logs as logs } from 'aws-cdk-lib';
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface LearningPlanApiProps {
  apiName: string;
  apiDescription: string;
  lambdaName: string;
}

export class LearningPlanApi extends Construct {
  constructor(scope: Construct, id: string, props: LearningPlanApiProps) {
    super(scope, id);

    const getLearningPlanFn = new lambda.Function(this, 'GetLearningPlanFunction', {
      functionName: props.lambdaName,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'get-learning-plan.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/dist')),
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        REGION: process.env.CDK_DEFAULT_REGION || 'us-west-2'
      }
    });

    // Grant the Lambda function permissions to invoke Bedrock models
    getLearningPlanFn.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream'
        ],
        resources: ['*']
      })
    );

    // Create a role for API Gateway CloudWatch logging with proper trust relationship
    const apiGatewayLoggingRole = new Role(this, 'ApiGatewayLoggingRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      description: 'Role for API Gateway to push logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')
      ]
    });

    const api = new apigateway.RestApi(this, 'LearningPlanApi', {
      restApiName: props.apiName,
      description: props.apiDescription,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'Origin',
          'Accept'
        ]
      },
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true, // Enable X-Ray tracing
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiGatewayAccessLogs')
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields()
      }
    });

    // Set the CloudWatch role ARN on the account
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayLoggingRole.roleArn
    });

    const learningPlan = api.root.addResource('learning-plan');

    // Add Lambda integration with CORS enabled
    const lambdaIntegration = new apigateway.LambdaIntegration(getLearningPlanFn, {
      timeout: Duration.seconds(29) // Maximum API Gateway timeout
    });

    learningPlan.addMethod('POST', lambdaIntegration);
  }
}

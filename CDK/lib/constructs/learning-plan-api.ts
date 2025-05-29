import { Construct } from 'constructs';
import { aws_lambda as lambda, aws_apigateway as apigateway, Duration } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
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
        metricsEnabled: true
      }
    });


    const learningPlan = api.root.addResource('learning-plan');

    // Add Lambda integration with CORS enabled
    // In CDK/lib/constructs/learning-plan-api.ts
    const lambdaIntegration = new apigateway.LambdaIntegration(getLearningPlanFn, {
      timeout: Duration.seconds(29) // Maximum API Gateway timeout
    });


    learningPlan.addMethod('POST', lambdaIntegration);

  }
}

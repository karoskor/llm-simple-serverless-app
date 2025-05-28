import { Construct } from 'constructs';
import { aws_lambda as lambda, aws_apigateway as apigateway } from 'aws-cdk-lib';
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
    });

    const api = new apigateway.RestApi(this, 'LearningPlanApi', {
      restApiName: props.apiName,
      description: props.apiDescription,
    });

    const learningPlan = api.root.addResource('learning-plan');
    learningPlan.addMethod('GET', new apigateway.LambdaIntegration(getLearningPlanFn));
    learningPlan.addMethod('POST', new apigateway.LambdaIntegration(getLearningPlanFn));
  }
}

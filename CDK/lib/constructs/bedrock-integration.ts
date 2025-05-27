import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface BedrockIntegrationProps {
    lambdaName: string;
}

export class BedrockIntegration extends Construct {
    constructor(scope: Construct, id: string, props: BedrockIntegrationProps) {
        super(scope, id);

        // Reference the existing Lambda function
        const existingLambda = lambda.Function.fromFunctionName(
            this,
            'GetLearningPlanFunction',
            props.lambdaName
        );

        // Create Bedrock policy
        const bedrockPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: ['arn:aws:bedrock:*::foundation-model/*'],
        });

        // Add Bedrock policy to the existing Lambda's role
        existingLambda.addToRolePolicy(bedrockPolicy);

    }
}

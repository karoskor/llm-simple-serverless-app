import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BedrockIntegration } from '../constructs/bedrock-integration';

export interface BedrockStackProps extends StackProps {
    getLambdaName: string;
}

export class BedrockStack extends Stack {
    constructor(scope: Construct, id: string, props: BedrockStackProps) {
        super(scope, id, props);

        new BedrockIntegration(this, 'BedrockIntegration', {
            lambdaName: props.getLambdaName
        });
    }
}
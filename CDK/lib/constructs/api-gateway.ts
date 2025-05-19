import { Construct } from 'constructs';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Function } from 'aws-cdk-lib/aws-lambda';

export interface ApiGatewayConstructProps {
    handler: Function;
    apiName?: string;
}

export class ApiGatewayConstruct extends Construct {
    public readonly api: RestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
        super(scope, id);

        this.api = new RestApi(this, 'RestApi', {
            restApiName: props.apiName || 'MyApi',
            deployOptions: {
                stageName: 'prod',
            },
        });

        const lambdaIntegration = new LambdaIntegration(props.handler);

        this.api.root.addMethod('ANY', lambdaIntegration);
    }
}
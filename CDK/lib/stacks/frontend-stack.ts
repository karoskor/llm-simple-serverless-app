import { Stack, StackProps, CfnOutput, RemovalPolicy, CustomResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

interface LearningPlanFrontendStackProps extends StackProps {
  apiEndpoint?: string;
}

export class LearningPlanFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: LearningPlanFrontendStackProps) {
    super(scope, id, props);

    const accountId = Stack.of(this).account;
    const apiEndpoint = cdk.Fn.importValue('LearningPlanApiEndpoint');

    // Build the frontend
    console.log('Building the frontend...');
    try {
      execSync('cd ../frontend && npm run build', { stdio: 'inherit' });
      console.log('Frontend build completed successfully');
    } catch (error) {
      console.error('Error building frontend:', error);
      throw error;
    }

    // Create an S3 bucket to host the static website
    const websiteBucket = new s3.Bucket(this, 'LearningPlanBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const oac = new cloudfront.S3OriginAccessControl(this, 'MyOAC', {
      signing: cloudfront.Signing.SIGV4_NO_OVERRIDE,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
      originAccessControl: oac,
    });

    // Create a CloudFront distribution to serve the static website
    const distribution = new cloudfront.Distribution(this, 'distro', {
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    websiteBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
        principals: [new ServicePrincipal('cloudfront.amazonaws.com')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${accountId}:distribution/${distribution.distributionId}`,
          },
        },
      }),
    );

    new CfnOutput(this, 'DistributionDomainName', {
      value: `https://${distribution.domainName}`,
    });

    new CfnOutput(this, 'BucketNameOutput', {
      value: websiteBucket.bucketName,
    });
    
    // First deploy the frontend assets
    const deployment = new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../../frontend/build'))],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
      prune: false // This prevents deletion of files not in the source
    });

    // Then create the config.json file after the deployment
    const configUploader = new AwsCustomResource(this, 'ConfigJsonUploader', {
      onCreate: {
        service: 'S3',
        action: 'putObject',
        parameters: {
          Bucket: websiteBucket.bucketName,
          Key: 'config.json',
          Body: JSON.stringify({ apiUrl: apiEndpoint }),
          ContentType: 'application/json'
        },
        physicalResourceId: PhysicalResourceId.of('config.json-uploader')
      },
      onUpdate: {
        service: 'S3',
        action: 'putObject',
        parameters: {
          Bucket: websiteBucket.bucketName,
          Key: 'config.json',
          Body: JSON.stringify({ apiUrl: apiEndpoint }),
          ContentType: 'application/json'
        },
        physicalResourceId: PhysicalResourceId.of('config.json-uploader')
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [websiteBucket.arnForObjects('config.json')]
      })
    });

    // Add dependency to ensure proper order
    configUploader.node.addDependency(deployment);
  }
}

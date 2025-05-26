import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class LearningPlanFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const accountId = Stack.of(this).account;

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
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // 1. Redirect HTTP to HTTPS
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
  }
}

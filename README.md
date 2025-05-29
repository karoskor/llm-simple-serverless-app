# llm-simple-serverless-app

This is a project for "Let's Build A Simple Serverless Application Using Large Language Model" technical workshop led by Amazon Development Center.

# Project setup

This is [AWS CDK ](https://docs.aws.amazon.com/cdk/v2/guide/home.html) (Cloud Development Kit) project written using TypeScript. This section will outline a general setup of the project, for more details look into the dedicated folder's README.

## Prerequisites

- [Node.js & npm](https://nodejs.org/)
- [AWS CDK Toolkit](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)

```sh
npm install -g aws-cdk
```

- [AWS Account](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with your credentials

## General setup

#### 1. Clone the repository

```
git clone https://github.com/karoskor/llm-simple-serverless-app.git
cd llm-simple-serverless-app
```

#### 2. Install dependencies and build the CDK project

```
cd CDK
npm install
npm run build
```

#### 3. Configure access to your account via AWS CLI

See: [Configuring the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)

To check if you are correctly configured, you can run:

```
aws sts get-caller-identity
```

You should see response similar to this:

```
{
    "UserId": "XXXXXXXXXXXX:xyz",
    "Account": "00000000000",
    "Arn": "arn:aws:sts::0000000000:role/xyz"
}
```

#### 4. Bootstrap account (only the first time you deploy the CDK resources to your account)

```
cdk bootstrap
```

#### 5. Deploy the learning plan application stacks

```
cdk deploy --all
```

Note the values of the bucket name (BucketNameOutput) and domain of your web application (DistributionDomainName). Example:

```
LearningPlanFrontendStack.BucketNameOutput = learningplanfrontendstack-learningplanbucket1234-12334
LearningPlanFrontendStack.DistributionDomainName = https://abcd.cloudfront.net
```

#### 6. Build frontend code

```sh
cd ../frontend
npm install
npm run build
```

#### 7. Upload frontend code to the bucket using the bucket name you noted

```sh
aws s3 sync build/ s3://<bucket_name>
```

#### 8. Enable the bedrock model

- Navigate to the AWS Console
- Go to Amazon Bedrock service
- Select "Model access" from the left navigation
- Manually toggle the model **Titan Text G1 - Express**
- Accept the terms and conditions

#### 9. Access your website

Your website will be available at the CloudFront domain that you noted in step 5.

### Useful Links

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

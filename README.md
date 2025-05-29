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

#### 2. Install dependencies for frontend and CDK

```sh
cd frontend
npm install
cd ../CDK
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

The deployment process will:
1. Deploy the API stack first
2. Build the frontend application
3. Create a config.json file with the API endpoint URL
4. Upload the frontend assets and config.json to the S3 bucket
5. Configure CloudFront for distribution

Note the CloudFront domain of your web application (DistributionDomainName). Example:

```
LearningPlanFrontendStack.DistributionDomainName = https://abcd.cloudfront.net
```

#### 6. Enable the bedrock model

- Navigate to the AWS Console
- Go to Amazon Bedrock service
- Select "Model access" from the left navigation
- Manually toggle the model **Titan Text G1 - Express**
- Accept the terms and conditions

#### 7. Access your website

Your website will be available at the CloudFront domain that you noted in step 5. The frontend is automatically deployed to S3 and distributed through CloudFront as part of the CDK deployment process.

### Architecture Overview

This application consists of three main components:

1. **Frontend (React)**: A simple web interface hosted on S3 and distributed via CloudFront
2. **API Gateway + Lambda**: Processes requests and communicates with Amazon Bedrock
3. **Amazon Bedrock**: Generates personalized learning plans using the Titan Text model

### Runtime Configuration

The application uses a runtime configuration approach:

1. A custom resource in the CDK stack creates a config.json file with the API endpoint URL
2. This file is uploaded to the S3 bucket during deployment
3. When the frontend loads, it fetches this configuration file first
4. The API URL from the config file is then used for all API calls

This approach allows the frontend to be configured without rebuilding it if the API endpoint changes.

### Troubleshooting

If you encounter issues with the deployment:

- Ensure you have enabled the Titan Text G1 - Express model in Amazon Bedrock
- Check CloudWatch Logs for any Lambda function errors
- Verify that your AWS CLI credentials have sufficient permissions

### Useful Links

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

---

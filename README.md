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

#### 5. Deploy the learning plan stack

```
cdk deploy
```

### Useful Links

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [AWS Free Tier](https://aws.amazon.com/free/)

---

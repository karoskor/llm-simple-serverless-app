#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LearningPlanStack } from '../lib/stacks/learning-plan-stack';
import { LearningPlanFrontendStack } from '../lib/stacks/frontend-stack';
import { BedrockStack } from "../lib/stacks/bedrock-stack";

const app = new cdk.App();

// Create the API stack first
const apiStack = new LearningPlanStack(app, 'LearningPlanStack', {});

// Create the frontend stack with a dependency on the API stack
const frontendStack = new LearningPlanFrontendStack(app, 'LearningPlanFrontendStack', {});

// Add dependency to ensure API stack is created before frontend stack
frontendStack.addDependency(apiStack);

// Create the Bedrock stack
new BedrockStack(app, 'BedrockStack', {
  getLambdaName: 'GetLearningPlanFunction'
});

app.synth();

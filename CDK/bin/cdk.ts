#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LearningPlanStack } from '../lib/stacks/learning-plan-stack';
import { LearningPlanFrontendStack } from '../lib/stacks/frontend-stack';

const app = new cdk.App();
new LearningPlanStack(app, 'LearningPlanStack', {});

new LearningPlanFrontendStack(app, 'LearningPlanFrontendStack', {});
import { LearningPlanApi } from '../lib/constructs/learning-plan-api';

import {BedrockStack} from "../lib/stacks/bedrock-stack";

new BedrockStack(app, 'BedrockStack', {
    getLambdaName: 'GetLearningPlanFunction'
});

app.synth();

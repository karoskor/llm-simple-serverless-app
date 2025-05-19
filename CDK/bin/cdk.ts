#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LeraningPlanStack } from '../lib/stacks/learning-plan-stack';

const app = new cdk.App();
new LeraningPlanStack(app, 'LearningPlanStack', {
});
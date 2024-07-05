#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CodeStack } from '../lib/code-stack';
// const Env = {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION
// }

const app = new cdk.App();
new CodeStack(app, 'CodeStack', {
    // env: Env,
    synthesizer: new cdk.DefaultStackSynthesizer({
        generateBootstrapVersionRule: false, // ★BootstrapVersionおよびそのバリデーションルールを出力しない
    }),
});

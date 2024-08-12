import * as cdk from 'aws-cdk-lib/core';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ecs from 'aws-cdk-lib/aws-ecs';

import { Construct } from 'constructs';
import { BaseResource } from "./abstract/base-resouce";


declare const service: ecs.FargateService;

export class CodePipeline extends BaseResource {
    constructor(scope: Construct, props?: cdk.StackProps) {
        super();

        const sbcntrCodeBuildProject = codebuild.Project.fromProjectName(scope, 'sbcntrCodeBuild-for-codepipeline', 'sbcntr-codebuild');

        const codePipelineRole = new iam.Role(scope, 'sbcntrCodePipelineRole', {
            assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
            roleName: 'sbcntr-pipeline-role',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceProfileForImageBuilderECRContainerBuilds'),
                // iam.ManagedPolicy.fromManagedPolicyName(scope, 'sbcntr-codebuild-policy', codebuildpolicy.managedPolicyName)
            ]
        });

        const codePipelineDeployRole = new iam.Role(scope, 'sbcntrCodePipelineDeployRole', {
            assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
            roleName: 'sbcntr-pipeline-deploy-role',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'),
                // iam.ManagedPolicy.fromManagedPolicyName(scope, 'sbcntr-codebuild-policy', codebuildpolicy.managedPolicyName)
            ]
        });

        codePipelineDeployRole.assumeRolePolicy?.addStatements(
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.ArnPrincipal(codePipelineRole.roleArn)],
              actions: ['sts:AssumeRole'],
            })
          );

        // add a stage
        const sourceArtifact = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
            actionName: 'GitHub_Source',
            owner: 'toma1110', // TODO GitHubユーザー名を指定
            repo: 'sbcntr-backend', // リポジトリ名を指定
            branch: 'main', // ブランチ名を指定
            connectionArn: `arn:aws:codeconnections:ap-northeast-1:${cdk.Stack.of(scope).account}:connection/b917afff-ba0b-4090-9943-40c8a7389e38`, // TODO 手動で取得したARNをここに入力
            output: sourceArtifact,
          });

          const sbcntrCodePipeline = new codepipeline.Pipeline(scope, 'sbcntrCodePipeline', {
            pipelineName: 'sbcntr-pipeline',
            role: codePipelineRole,
            stages: [
                {
                  stageName: 'Source',
                  actions: [sourceAction],
                },
            ]
        });

        // add a build stage
        const buildStage = sbcntrCodePipeline.addStage({ stageName: 'Build' });
        const buildArtifact = new codepipeline.Artifact();

        // add a build action to the stage
        buildStage.addAction(new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: sbcntrCodeBuildProject,
            input: sourceArtifact,
            outputs: [buildArtifact],
            runOrder: 2,
        }));

        // add a build stage
        const deployStage = sbcntrCodePipeline.addStage({ stageName: 'Deploy' });
        const ecsApplication = codedeploy.EcsApplication.fromEcsApplicationName(scope, 'backend-application', this.createResourceName(scope, 'backend-application'))
        const ecsDeploymentGroup = codedeploy.EcsDeploymentGroup.fromEcsDeploymentGroupAttributes(scope, 'backend-deploymentgroup', {
            application: ecsApplication,
            deploymentGroupName: this.createResourceName(scope, 'backend-deployment-group'),
        });
        deployStage.addAction(new codepipeline_actions.CodeDeployEcsDeployAction({
            actionName: 'Deploy',
            deploymentGroup: ecsDeploymentGroup,

            //   // the properties below are optional
            //   appSpecTemplateFile: artifactPath,
            appSpecTemplateInput: sourceArtifact,
            containerImageInputs: [{
                input: buildArtifact,

                // the properties below are optional
                taskDefinitionPlaceholder: 'IMAGE1_NAME',
            }],
            role: codePipelineDeployRole,
            //   runOrder: 123,
            //   taskDefinitionTemplateFile: artifactPath,
            taskDefinitionTemplateInput: sourceArtifact,
            //   variablesNamespace: 'variablesNamespace',
        }));
    }
}

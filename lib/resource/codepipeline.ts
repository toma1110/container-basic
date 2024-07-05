import { Fn, RemovalPolicy } from "aws-cdk-lib";
import * as cdk from 'aws-cdk-lib/core';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ecs from 'aws-cdk-lib/aws-ecs';

import { Construct } from 'constructs';
import { BaseResource } from "./abstract/base-resouce";
import { CodeBuild } from './codebuild';
import { CodeDeploy } from './codedeploy';
import { Ecs } from './ecs';

declare const service: ecs.FargateService;

export class CodePipeline extends BaseResource {
    // public sbcntrCodePipeline: codepipeline.Pipeline;
    // public sbcntrCodeBuildProject
    // public sbcntrServiceBackend
    // public sourceArtifact: codepipeline.Artifact
    constructor(scope: Construct, props?: cdk.StackProps) {
        super();

        const sbcntrServiceBackendId = Fn.importValue('sbcntr-service-backendId');

        const sbcntrBackendRepository = codecommit.Repository.fromRepositoryName(scope, 'sbcntr-backend-for-codepipeline', 'sbcntr-backend');
        const sbcntrCodeBuildProject = codebuild.Project.fromProjectName(scope, 'sbcntrCodeBuild-for-codepipeline', 'sbcntr-codebuild');
        // this.sbcntrCodeBuildProject = codebuild.Project.fromProjectName(scope, 'sbcntrCodeBuild-for-codepipeline', 'sbcntr-codebuild');
        // this.sbcntrServiceBackend = ecs.FargateService.fromFargateServiceArn(scope, 'sbcnt-service-backend', sbcntrServiceBackendId);

        const codePipelineRole = new iam.Role(scope, 'sbcntrCodePipelineRole', {
            assumedBy: new iam.ServicePrincipal('codepipeline.amazonaws.com'),
            roleName: 'sbcntr-pipeline-role',
            managedPolicies: [
                // iam.ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceProfileForImageBuilderECRContainerBuilds'),
                // iam.ManagedPolicy.fromManagedPolicyName(scope, 'sbcntr-codebuild-policy', codebuildpolicy.managedPolicyName)
            ]
        });

        // this.sbcntrCodePipeline = new codepipeline.Pipeline(scope, 'sbcntrCodePipeline', {
        const sbcntrCodePipeline = new codepipeline.Pipeline(scope, 'sbcntrCodePipeline', {
            pipelineName: 'sbcntr-pipeline',
            role: codePipelineRole,
            // stages:codepipeline.
        });

        // add a stage
        const sourceStage = sbcntrCodePipeline.addStage({ stageName: 'Source' });
        // const sourceStage = this.sbcntrCodePipeline.addStage({ stageName: 'Source' });

        // add a source action to the stage
        // this.sourceArtifact = new codepipeline.Artifact();
        const sourceArtifact = new codepipeline.Artifact();
        sourceStage.addAction(new codepipeline_actions.CodeCommitSourceAction({
            actionName: 'Source',
            output: sourceArtifact,
            repository: sbcntrBackendRepository,
            branch: 'main'
        }));

        // add a build stage
        const buildStage = sbcntrCodePipeline.addStage({ stageName: 'Build' });
        const buildArtifact = new codepipeline.Artifact();

        // // add a build action to the stage
        // const deployInput = new codepipeline.Artifact();
        buildStage.addAction(new codepipeline_actions.CodeBuildAction({
            actionName: 'Build',
            project: sbcntrCodeBuildProject,
            input: sourceArtifact,
            outputs: [buildArtifact],
            runOrder: 2,
        }));

        // add a build stage
        const deployStage = sbcntrCodePipeline.addStage({ stageName: 'Deploy' });
        const application = codedeploy.EcsApplication;
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
            //   role: role,
            //   runOrder: 123,
            //   taskDefinitionTemplateFile: artifactPath,
            taskDefinitionTemplateInput: sourceArtifact,
            //   variablesNamespace: 'variablesNamespace',
        }));


        // new cdk.CfnOutput(scope, 'sbcntrBackendRepositoryArn', {
        //     value: sbcntrBackendRepository.repositoryArn,
        //     exportName: 'sbcntr--backend-repository-arn',
        // });
    }

    // public sbcntrCodeBuildOutputs: codepipeline.Artifact
    // addBuildStage() {
    //     // Add build stage
    //     const buildStage = this.sbcntrCodePipeline.addStage({ stageName: 'Build' });
    //     buildStage.addAction(new codepipeline_actions.CodeBuildAction({
    //         actionName: 'Build',
    //         project: this.sbcntrCodeBuildProject, // Assuming CodeBuild class has a project property
    //         input: this.sourceArtifact, // Assuming you use the pipeline's artifact bucket
    //         outputs: [this.sbcntrCodeBuildOutputs] // This can be adjusted as needed
    //     }));
    // }

    // declare ecsDeploymentGroup: codedeploy.EcsDeploymentGroup;

    // addDeployStage() {
    //     // Add Deploy stage
    //     // declare const artifact: codepipeline.Artifact;
    //     // declare const artifactPath: codepipeline.ArtifactPath;
    //     // declare const role: iam.Role;
    //     const codeDeployEcsDeployAction = new codepipeline_actions.CodeDeployEcsDeployAction({
    //         actionName: 'Deploy',
    //         deploymentGroup: this.ecsDeploymentGroup,

    //   // the properties below are optional
    //   appSpecTemplateFile: artifactPath,
    //   appSpecTemplateInput: artifact,
    //   containerImageInputs: [{
    //     input: artifact,

    //     // the properties below are optional
    //     taskDefinitionPlaceholder: 'taskDefinitionPlaceholder',
    //   }],
    //   role: role,
    //   runOrder: 123,
    //   taskDefinitionTemplateFile: artifactPath,
    //   taskDefinitionTemplateInput: artifact,
    //   variablesNamespace: 'variablesNamespace',
    // });

    //     const deployStage = this.sbcntrCodePipeline.addStage({ stageName: 'Deploy' });
    //     deployStage.addAction(new codepipeline_actions.EcsDeployAction({
    //         actionName: 'Deploy',
    //         service, //: this.sbcntrServiceBackend,
    //         // if your file is called imagedefinitions.json,
    //         // use the `input` property,
    //         // and leave out the `imageFile` property
    //         input: buildOutput,
    //         // if your file name is _not_ imagedefinitions.json,
    //         // use the `imageFile` property,
    //         // and leave out the `input` property
    //         imageFile: buildOutput.atPath('imageDef.json'),
    //         deploymentTimeout: Duration.minutes(60), // optional, default is 60 minutes
    //         project: this.sbcntrCodeBuildProject, // Assuming CodeBuild class has a project property
    //         input: this.sourceArtifact, // Assuming you use the pipeline's artifact bucket
    //         outputs: [new codepipeline.Artifact()] // This can be adjusted as needed
    //     }));
}

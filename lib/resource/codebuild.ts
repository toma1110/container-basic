import * as cdk from 'aws-cdk-lib/core';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import { BaseResource } from "./abstract/base-resouce";
import * as codecommit from 'aws-cdk-lib/aws-codecommit';




export class CodeBuild extends BaseResource {
    constructor(scope: Construct, /* codecommit: CodeCommit,*/ props?: cdk.StackProps) {
        super();

        const sbcntrBackendRepository = codecommit.Repository.fromRepositoryName(scope, 'sbcntr-backend-for-codebuild', 'sbcntr-backend')

        // const codebuildpolicy = new iam.ManagedPolicy(scope, 'sbcntrCodeBuildPolicy', {
        //     statements: [
        //         new iam.PolicyStatement({
        //             effect: iam.Effect.ALLOW,
        //             actions: [
        //                 'codecommit:GitPull',
        //             ],
        //             resources: [
        //                 `arn:aws:codecommit:ap-northeast-1:${cdk.Stack.of(scope).account}:sbcntr-backend`,
        //             ],
        //         }),
        //         new iam.PolicyStatement({
        //             effect: iam.Effect.ALLOW,
        //             actions: [
        //                 'logs:CreateLogGroup',
        //                 'logs:CreateLogStream',
        //                 'logs:PutLogEvents'
        //             ],
        //             resources: [
        //                 `arn:aws:logs:ap-northeast-1:${cdk.Stack.of(scope).account}:log-group:/aws/codebuild/sbcntr-codebuild:*`,
        //                 `arn:aws:logs:ap-northeast-1:${cdk.Stack.of(scope).account}:log-group:/aws/codebuild/sbcntr-codebuild`
        //             ],
        //         }),
        //         new iam.PolicyStatement({
        //             effect: iam.Effect.ALLOW,
        //             actions: [
        //                 'codebuild:BatchPutCodeCoverages',
        //                 'codebuild:BatchPutTestCases',
        //                 'codebuild:CreateReport',
        //                 'codebuild:CreateReportGroup',
        //                 'codebuild:UpdateReport',
        //             ],
        //             resources: [
        //                 `arn:aws:codecommit:ap-northeast-1:${cdk.Stack.of(scope).account}:sbcntr-backend`,
        //             ],
        //         }),
        //     ],
        //     managedPolicyName: 'sbcntr-codebuild-policy'
        // })

        const codebuildRole = new iam.Role(scope, 'sbcntrCodeBuildRole', {
            assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
            roleName: 'sbcntr-codebuild-role',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceProfileForImageBuilderECRContainerBuilds'),
                // iam.ManagedPolicy.fromManagedPolicyName(scope, 'sbcntr-codebuild-policy', codebuildpolicy.managedPolicyName)
            ]
        });

        // ベースイメージ格納用ECR作成（IPガチャ回避）
        const ecrrepo = new ecr.Repository(scope, 'sbcntrBaseRepo', {
            autoDeleteImages: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            repositoryName: "sbcntr-base"
        });
        new codebuild.Project(scope, 'sbcntrCodeBuild', {
            projectName: 'sbcntr-codebuild',
            badge: true,
            source: codebuild.Source.codeCommit({
                identifier: 'source1',
                repository: sbcntrBackendRepository,
                branchOrRef: "refs/heads/main"
            }),

            role: codebuildRole,
            environment: {
                buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_5,
                privileged: true
            },
            timeout: cdk.Duration.hours(1),
            queuedTimeout: cdk.Duration.hours(8),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.DOCKER_LAYER)
        });
    }
}

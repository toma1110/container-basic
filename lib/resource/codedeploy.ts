import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { Construct } from 'constructs';
import { Fn } from "aws-cdk-lib";
import { BaseResource } from "./abstract/base-resouce";
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { SecurityGroup } from "./security-group";


export class CodeDeploy extends BaseResource {
    public readonly backdendDeployMentGroup: codedeploy.EcsDeploymentGroup

    constructor(scope: Construct, securityGroup: SecurityGroup, props?: cdk.StackProps) {
        super();

        const sbcntrstgvpcId = Fn.importValue('sbcntr-stg-vpc');
        const sbcntrstgsubnetpublic1aId = Fn.importValue('sbcntr-stg-subnet-public-1a');
        const sbcntrstgsubnetpublic1cId = Fn.importValue('sbcntr-stg-subnet-public-1c');
        const sbcntrStgTgDemoBlueArn = Fn.importValue('sbcntr-stg-tg-demo-blue-arn');
        const sbcntrStgTgDemoGreenArn = Fn.importValue('sbcntr-stg-tg-demo-green-arn');
        const sbcntrStgListenerInternalArn = Fn.importValue('sbcntr-stg-listener-internal-arn');
        const sbcntrstgsubnetcontainer1aId = Fn.importValue('sbcntr-stg-subnet-container-1a');
        const sbcntrstgsubnetcontainer1cId = Fn.importValue('sbcntr-stg-subnet-container-1c');
        const sbcntrstgecsCodeDeployRole = Fn.importValue('sbcntr-stg-ecsCodeDeployRole');

        // VPC を取得
        const vpc = ec2.Vpc.fromVpcAttributes(scope, 'ImportedVPC', {
            vpcId: sbcntrstgvpcId,
            availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c'],

            // Either pass literals for all IDs
            publicSubnetIds: [sbcntrstgsubnetpublic1aId, sbcntrstgsubnetpublic1cId],


        });

        // ELBの参照
        const blueTargetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(scope, 'ImportedBlueTG', {
            targetGroupArn: sbcntrStgTgDemoBlueArn,
        });

        const greenTargetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(scope, 'ImportedGreenTG', {
            targetGroupArn: sbcntrStgTgDemoGreenArn,
        });

        const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(scope, 'ImportedListener', {
            listenerArn: sbcntrStgListenerInternalArn,
            securityGroup: ec2.SecurityGroup.fromSecurityGroupId(scope, 'ImportedSG', securityGroup.inter.attrGroupId),
        });

        // ECSの参照
        const clusterBackend = ecs.Cluster.fromClusterAttributes(scope, 'backendCluster', {
            clusterName: this.createResourceName(scope, 'backend-cluster'),
            vpc: vpc,
        })

        const serviceBackend = ecs.FargateService.fromFargateServiceAttributes(scope, 'backendService', {
            cluster: clusterBackend,
            serviceName: this.createResourceName(scope, 'backend-service'),
        })

        // IAM Roleの参照
        const codeDeployRole = iam.Role.fromRoleName(scope, 'codeDeployRole', sbcntrstgecsCodeDeployRole)

        // CodeDeployアプリケーションの作成
        const application = new codedeploy.EcsApplication(scope, 'MyApplication', {
            applicationName: this.createResourceName(scope, 'backend-application'),
        });

        // CodeDeployデプロイメントグループの作成
        this.backdendDeployMentGroup = new codedeploy.EcsDeploymentGroup(scope, 'MyDeploymentGroup', {
            application,
            deploymentGroupName: this.createResourceName(scope, 'backend-deployment-group'),
            service: serviceBackend,
            deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
            blueGreenDeploymentConfig: {
                blueTargetGroup,
                greenTargetGroup,
                listener,
            },
            role: codeDeployRole
        });
    }
}
import { Fn, RemovalPolicy } from "aws-cdk-lib";
import { CfnService, CfnCluster, CfnTaskDefinition, DeploymentControllerType } from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from "constructs";
import { BaseResource } from "./abstract/base-resouce";
import { Vpc } from "./vpc";
import { LoadBalancer } from "./load-balancer";
import { TargetGroup } from "./target-group";
import { SecurityGroup } from "./security-group";



export class Ecs extends BaseResource {
    public readonly taskDefinitionBackend: CfnTaskDefinition;
    public readonly clusterBackend: CfnCluster;
    public readonly serviceBackend: CfnService;
    public readonly taskDefinitionFrontend: CfnTaskDefinition;
    public readonly clusterFrontend: CfnCluster;
    public readonly serviceFrontend: CfnService;
    constructor(
        scope: Construct,
        vpc: Vpc,
        accountId: string,
        securityGroup: SecurityGroup,
        // subnet: Subnet,
        targetGroup: TargetGroup,
        loadBalancer: LoadBalancer
    ) {
        super();
        const sbcntrStgRoleTaskDefinitionArn = Fn.importValue('sbcntr-stg-role-taskDefinitionArn');
        const sbcntrstgsubnetcontainer1aId = Fn.importValue('sbcntr-stg-subnet-container-1a');
        const sbcntrstgsubnetcontainer1cId = Fn.importValue('sbcntr-stg-subnet-container-1c');

        // CloudWatch Logsのロググループを作成
        const logGroupBackend = new logs.LogGroup(scope, 'BackendLogGroup', {
            logGroupName: '/ecs/sbcntr-stg-backend',
            removalPolicy: RemovalPolicy.DESTROY, // スタックの削除時にロググループも削除する
        });

        const logGroupFrontend = new logs.LogGroup(scope, 'FrontendLogGroup', {
            logGroupName: '/ecs/sbcntr-stg-frontend',
            removalPolicy: RemovalPolicy.DESTROY, // スタックの削除時にロググループも削除する
        });

        // // 「コンテナのリリース（ブルーグリーンデプロイ）を体験」実行の際にコメントイン
        // const RDSSecretSbcntrMysqlArn = Fn.importValue('RDSSecret-sbcntr-mysql');

        this.taskDefinitionBackend = new CfnTaskDefinition(scope, 'backend-def', {
            containerDefinitions: [{
                image: accountId + '.dkr.ecr.ap-northeast-1.amazonaws.com/sbcntr-stg-backend:v1',
                name: 'app',

                // the properties below are optional
                cpu: 256,
                essential: true,
                memoryReservation: 512,
                portMappings: [{
                    appProtocol: 'http',
                    containerPort: 80,
                    hostPort: 80,
                    name: 'app',
                    protocol: 'tcp',
                }],
                // // 「コンテナのリリース（ブルーグリーンデプロイ）を体験」実行の際にコメントイン
                // secrets: [ // Secrets Managerからのシークレットを追加
                //     {
                //         name: 'DB_HOST',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':host::'
                //     },
                //     {
                //         name: 'DB_NAME',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':dbname::'
                //     },
                //     {
                //         name: 'DB_USERNAME',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':username::'
                //     },
                //     {
                //         name: 'DB_PASSWORD',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':password::'
                //     },
                // ],
                logConfiguration: {
                    logDriver: 'awslogs',
                    options: {
                        'awslogs-group': logGroupBackend.logGroupName,
                        'awslogs-region': 'ap-northeast-1',
                        'awslogs-stream-prefix': 'ecs',
                    },
                },
            }],
            cpu: '512',
            executionRoleArn: sbcntrStgRoleTaskDefinitionArn,
            memory: '1024',
            networkMode: 'awsvpc',
            tags: [{
                key: 'Name',
                value: this.createResourceName(scope, 'backend-taskdefinition'),
            }],
        });

        this.clusterBackend = new CfnCluster(scope, 'backend-cluster', {
            capacityProviders: ['FARGATE'],
            clusterName: this.createResourceName(scope, 'backend-cluster'),
        });


        const serviceBackend = new CfnService(scope, 'backend-service', {
            capacityProviderStrategy: [{
                base: 0,
                capacityProvider: 'FARGATE',
                weight: 1,
            }],
            cluster: this.clusterBackend.attrArn,
            desiredCount: 1,
            loadBalancers: [{
                containerName: 'app',
                containerPort: 80,
                targetGroupArn: targetGroup.tgSbcntrDemoBlue.attrTargetGroupArn,
            }],
            networkConfiguration: {
                awsvpcConfiguration: {
                    // assignPublicIp: 'assignPublicIp',
                    securityGroups: [securityGroup.con.attrGroupId],
                    subnets: [sbcntrstgsubnetcontainer1aId, sbcntrstgsubnetcontainer1cId],
                },
            },
            serviceName: this.createResourceName(scope, 'backend-service'),
            taskDefinition: this.taskDefinitionBackend.attrTaskDefinitionArn,
            deploymentController: {
                type: DeploymentControllerType.CODE_DEPLOY
            }
        });




        this.taskDefinitionFrontend = new CfnTaskDefinition(scope, 'frontend-def', {
            containerDefinitions: [{
                // // 「コンテナのリリース（ブルーグリーンデプロイ）を体験」実行の際にコメントアウト
                image: accountId + '.dkr.ecr.ap-northeast-1.amazonaws.com/sbcntr-stg-frontend:v1',
                // // 「コンテナのリリース（ブルーグリーンデプロイ）を体験」実行の際にコメントイン
                // image: accountId + '.dkr.ecr.ap-northeast-1.amazonaws.com/sbcntr-stg-frontend:dbv1',
                name: 'app',

                // the properties below are optional
                cpu: 256,
                essential: true,
                memoryReservation: 512,
                portMappings: [{
                    appProtocol: 'http',
                    containerPort: 80,
                    hostPort: 80,
                    name: 'app',
                    protocol: 'tcp',
                }],
                // // 「コンテナのリリース（ブルーグリーンデプロイ）を体験」実行の際にコメントイン
                // secrets: [ // Secrets Managerからのシークレットを追加
                //     {
                //         name: 'DB_HOST',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':host::'
                //     },
                //     {
                //         name: 'DB_NAME',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':dbname::'
                //     },
                //     {
                //         name: 'DB_USERNAME',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':username::'
                //     },
                //     {
                //         name: 'DB_PASSWORD',
                //         valueFrom: RDSSecretSbcntrMysqlArn + ':password::'
                //     },
                // ],
                environment: [
                    {
                        name: "SESSION_SECRET_KEY",
                        value: "41b678c65b37bf99c37bcab522802760"
                    },
                    {
                        name: "NOTIF_SERVICE_HOST",
                        value: "http://" + loadBalancer.albInternal.attrDnsName
                    },
                    {
                        name: "APP_SERVICE_HOST",
                        value: "http://" + loadBalancer.albInternal.attrDnsName
                    }
                ],
                logConfiguration: {
                    logDriver: 'awslogs',
                    options: {
                        'awslogs-group': logGroupFrontend.logGroupName,
                        'awslogs-region': 'ap-northeast-1',
                        'awslogs-stream-prefix': 'ecs',
                    },
                },
            }],
            cpu: '512',
            executionRoleArn: sbcntrStgRoleTaskDefinitionArn,
            memory: '1024',
            networkMode: 'awsvpc',
            tags: [{
                key: 'Name',
                value: this.createResourceName(scope, 'frontend-taskdefinition'),
            }],
        });

        this.clusterFrontend = new CfnCluster(scope, 'frontend-cluster', {
            capacityProviders: ['FARGATE'],
            clusterName: this.createResourceName(scope, 'frontend-cluster'),
        });


        const serviceFrontend = new CfnService(scope, 'frontend-service', {
            capacityProviderStrategy: [{
                base: 0,
                capacityProvider: 'FARGATE',
                weight: 1,
            }],
            cluster: this.clusterFrontend.attrArn,
            desiredCount: 1,
            loadBalancers: [{
                containerName: 'app',
                containerPort: 80,
                targetGroupArn: targetGroup.tgFrontend.attrTargetGroupArn,
            }],
            networkConfiguration: {
                awsvpcConfiguration: {
                    // assignPublicIp: 'assignPublicIp',
                    securityGroups: [securityGroup.fcon.attrGroupId],
                    subnets: [sbcntrstgsubnetcontainer1aId, sbcntrstgsubnetcontainer1cId],
                },
            },
            serviceName: this.createResourceName(scope, 'frontend-service'),
            taskDefinition: this.taskDefinitionFrontend.attrTaskDefinitionArn,
            // deploymentController: {
            //     type: DeploymentControllerType.CODE_DEPLOY
            // }
        });

    }

}

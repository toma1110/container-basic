import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnRole, CfnInstanceProfile, PolicyDocument, PolicyStatement, PolicyStatementProps, Effect, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BaseResource } from './abstract/base-resouce';

interface InstanceProfileInfo {
    readonly id: string;
    readonly assign: (instanceProfile: CfnInstanceProfile) => void;
}

interface ResourceInfo {
    readonly id: string;
    readonly policyStatementProps: PolicyStatementProps;
    readonly managedPolicyArns: string[];
    readonly resourceName: string;
    readonly instanceProfile?: InstanceProfileInfo;
    readonly assign: (role: CfnRole) => void;
}

export class Role extends BaseResource {
    public readonly ec2: CfnRole;
    public readonly rds: CfnRole;
    public readonly instanceProfileEc2: CfnInstanceProfile;
    public readonly codeDeploy: CfnRole;
    public readonly taskDefinition: CfnRole;

    private readonly resources: ResourceInfo[] = [
        {
            id: 'RoleRds',
            policyStatementProps: {
                effect: Effect.ALLOW,
                principals: [new ServicePrincipal('monitoring.rds.amazonaws.com')],
                actions: ['sts:AssumeRole']
            },
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
            ],
            resourceName: 'role-rds',
            assign: role => (this.rds as CfnRole) = role
        },
        {
            id: 'RoleCodeDeploy',
            policyStatementProps: {
                effect: Effect.ALLOW,
                principals: [new ServicePrincipal('codedeploy.amazonaws.com')],
                actions: ['sts:AssumeRole']
            },
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS'
            ],
            resourceName: 'ecsCodeDeployRole',
            assign: role => (this.codeDeploy as CfnRole) = role
        },
        {
            id: 'RoleTaskDefinition',
            policyStatementProps: {
                effect: Effect.ALLOW,
                principals: [new ServicePrincipal('ecs-tasks.amazonaws.com')],
                actions: ['sts:AssumeRole']
            },
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
                'arn:aws:iam::aws:policy/SecretsManagerReadWrite'
            ],
            resourceName: 'role-taskDefinition',
            assign: role => (this.taskDefinition as CfnRole) = role
        },
    ];

    constructor(scope: Construct) {
        super();

        for (const resourceInfo of this.resources) {
            const role = this.createRole(scope, resourceInfo);
            resourceInfo.assign(role);

            const instanceProfileInfo = resourceInfo.instanceProfile;
            if (instanceProfileInfo) {
                const instanceProfile = this.createInstanceProfile(scope, instanceProfileInfo, role);
                instanceProfileInfo.assign(instanceProfile);
            }
        }

    }

    private createRole(scope: Construct, resourceInfo: ResourceInfo): CfnRole {
        const policyStatement = new PolicyStatement(resourceInfo.policyStatementProps);

        const policyDocument = new PolicyDocument({
            statements: [policyStatement]
        });

        const role = new CfnRole(scope, resourceInfo.id, {
            assumeRolePolicyDocument: policyDocument,
            managedPolicyArns: resourceInfo.managedPolicyArns,
            roleName: this.createResourceName(scope, resourceInfo.resourceName)
        });

        new CfnOutput(scope, resourceInfo.id + "outputName", {
            value: this.createResourceName(scope, resourceInfo.resourceName),
            exportName: this.createResourceName(scope, resourceInfo.resourceName)
        });

        // Todo IAMのArnのOutputコーディング中
        new CfnOutput(scope, resourceInfo.id + "outputArn", {
            value: role.attrArn,
            exportName: this.createResourceName(scope, resourceInfo.resourceName) + "Arn"
        });

        return role;
    }

    private createInstanceProfile(scope: Construct, instanceProfileInfo: InstanceProfileInfo, role: CfnRole): CfnInstanceProfile {
        const instanceProfile = new CfnInstanceProfile(scope, instanceProfileInfo.id, {
            roles: [role.ref],
            instanceProfileName: role.roleName
        });

        return instanceProfile;
    }
}

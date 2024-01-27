import { CfnSecurityGroup, CfnSecurityGroupIngress, CfnSecurityGroupIngressProps } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Fn, CfnOutput } from "aws-cdk-lib";
import { BaseResource } from "./abstract/base-resouce";
import { Vpc } from "./vpc";

interface IngressInfo {
    readonly id: string;
    readonly securityGroupIngressProps: CfnSecurityGroupIngressProps;
    readonly groupId: () => string;
    readonly sourceSecurityGroupId?: () => string;
}

interface ResourceInfo {
    readonly id: string;
    readonly groupDescription: string;
    readonly ingresses: IngressInfo[];
    readonly resourceName: string;
    readonly assign: (securityGroup: CfnSecurityGroup) => void;
}

export class SecurityGroup extends BaseResource {
    public readonly ing: CfnSecurityGroup;
    public readonly mng: CfnSecurityGroup;
    public readonly con: CfnSecurityGroup;
    public readonly fcon: CfnSecurityGroup;
    public readonly inter: CfnSecurityGroup;
    public readonly rds: CfnSecurityGroup;
    public readonly vpce: CfnSecurityGroup;


    private readonly vpc: Vpc;
    private readonly resources: ResourceInfo[] = [
        {
            id: 'SecurityGroupIngress',
            groupDescription: 'Security group for ingress',
            ingresses: [
                {
                    id: 'SecurityGroupIngress1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        cidrIp: '0.0.0.0/0',
                        fromPort: 80,
                        toPort: 80
                    },
                    groupId: () => this.ing.attrGroupId
                },
            ],
            resourceName: 'sg-ingress',
            assign: securityGroup => (this.ing as CfnSecurityGroup) = securityGroup
        },
        {
            id: 'SecurityGroupMng',
            groupDescription: 'Security Group of management server',
            ingresses: [
                {
                    id: 'SecurityGroupIngressMng1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 22,
                        toPort: 22
                    },
                    groupId: () => this.mng.attrGroupId,
                    sourceSecurityGroupId: () => this.mng.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressMng2',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        cidrIp: '0.0.0.0/0',
                        fromPort: 22,
                        toPort: 22
                    },
                    groupId: () => this.ing.attrGroupId
                },
            ],
            resourceName: 'sg-management',
            assign: securityGroup => (this.mng as CfnSecurityGroup) = securityGroup
        },
        {
            id: 'SecurityGroupFrontContainer',
            groupDescription: 'Security Group of front container app',
            ingresses: [
                {
                    id: 'SecurityGroupIngressFcon1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 80,
                        toPort: 80
                    },
                    groupId: () => this.fcon.attrGroupId,
                    sourceSecurityGroupId: () => this.ing.attrGroupId,
                }
            ],
            resourceName: 'sg-front-container',
            assign: securityGroup => (this.fcon as CfnSecurityGroup) = securityGroup
        },
        {
            id: 'SecurityGroupInternal',
            groupDescription: 'Security group for internal load balancer',
            ingresses: [
                {
                    id: 'SecurityGroupIngressInter1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 80,
                        toPort: 80
                    },
                    groupId: () => this.inter.attrGroupId,
                    sourceSecurityGroupId: () => this.fcon.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressInter2',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 80,
                        toPort: 80
                    },
                    groupId: () => this.inter.attrGroupId,
                    sourceSecurityGroupId: () => this.mng.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressInter3',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 10080,
                        toPort: 10080
                    },
                    groupId: () => this.inter.attrGroupId,
                    sourceSecurityGroupId: () => this.mng.attrGroupId,
                }
            ],
            resourceName: 'sg-internal',
            assign: securityGroup => (this.inter as CfnSecurityGroup) = securityGroup
        },
        {
            id: 'SecurityGroupContainer',
            groupDescription: 'Security Group of backend app',
            ingresses: [
                {
                    id: 'SecurityGroupIngressCon1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 80,
                        toPort: 80
                    },
                    groupId: () => this.con.attrGroupId,
                    sourceSecurityGroupId: () => this.inter.attrGroupId,
                }
            ],
            resourceName: 'sg-container',
            assign: securityGroup => (this.con as CfnSecurityGroup) = securityGroup
        },
        {
            id: 'SecurityGroupDb',
            groupDescription: 'Security Group of database',
            ingresses: [
                {
                    id: 'SecurityGroupIngressDb1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 3306,
                        toPort: 3306
                    },
                    groupId: () => this.rds.attrGroupId,
                    sourceSecurityGroupId: () => this.con.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressDb2',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 3306,
                        toPort: 3306
                    },
                    groupId: () => this.rds.attrGroupId,
                    sourceSecurityGroupId: () => this.fcon.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressDb3',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 3306,
                        toPort: 3306
                    },
                    groupId: () => this.rds.attrGroupId,
                    sourceSecurityGroupId: () => this.mng.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressDb4',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        cidrIp: '10.0.240.0/24',
                        fromPort: 3306,
                        toPort: 3306
                    },
                    groupId: () => this.rds.attrGroupId
                },
            ],
            resourceName: 'sg-db',
            assign: securityGroup => (this.rds as CfnSecurityGroup) = securityGroup
        },
        {
            id: 'SecurityGroupVpce',
            groupDescription: 'Security Group of VPC Endpoint',
            ingresses: [
                {
                    id: 'SecurityGroupIngressVpce1',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 443,
                        toPort: 443
                    },
                    groupId: () => this.vpce.attrGroupId,
                    sourceSecurityGroupId: () => this.fcon.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressVpce2',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 443,
                        toPort: 443
                    },
                    groupId: () => this.vpce.attrGroupId,
                    sourceSecurityGroupId: () => this.con.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressVpce3',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        fromPort: 443,
                        toPort: 443
                    },
                    groupId: () => this.vpce.attrGroupId,
                    sourceSecurityGroupId: () => this.mng.attrGroupId,
                },
                {
                    id: 'SecurityGroupIngressVpce4',
                    securityGroupIngressProps: {
                        ipProtocol: 'tcp',
                        cidrIp: '10.0.240.0/24',
                        fromPort: 443,
                        toPort: 443
                    },
                    groupId: () => this.vpce.attrGroupId
                },
            ],
            resourceName: 'sg-vpce',
            assign: securityGroup => (this.vpce as CfnSecurityGroup) = securityGroup
        },
    ];

    constructor(scope: Construct) {
        super();

        for (const resourceInfo of this.resources) {
            const securityGroup = this.createSecurityGroup(scope, resourceInfo);
            resourceInfo.assign(securityGroup);

            this.createSecurityGroupIngress(scope, resourceInfo);
        }
    }

    private createSecurityGroup(scope: Construct, resourceInfo: ResourceInfo): CfnSecurityGroup {
        const sbcntrStgVpcId = Fn.importValue('sbcntr-stg-vpc');
        const resourceName = this.createResourceName(scope, resourceInfo.resourceName);
        const securityGroup = new CfnSecurityGroup(scope, resourceInfo.id, {
            groupDescription: resourceInfo.groupDescription,
            groupName: resourceName,
            vpcId: sbcntrStgVpcId,
            tags: [{
                key: 'Name',
                value: resourceName
            }]
        });

        return securityGroup;
    }

    private createSecurityGroupIngress(scope: Construct, resourceInfo: ResourceInfo) {
        for (const ingress of resourceInfo.ingresses) {
            const securityGroupIngress = new CfnSecurityGroupIngress(scope, ingress.id, ingress.securityGroupIngressProps);
            securityGroupIngress.groupId = ingress.groupId();

            if (ingress.sourceSecurityGroupId) {
                securityGroupIngress.sourceSecurityGroupId = ingress.sourceSecurityGroupId();
            }
        }
    }
}

import { CfnOutput } from 'aws-cdk-lib';
import { CfnSubnet, CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { BaseResource } from './abstract/base-resouce';
import { Vpc } from './vpc';

interface ResourceInfo {
    readonly id: string;
    readonly cidrBlock: string;
    readonly availabilityZone: string;
    readonly resourceName: string;
    readonly assign: (subnet: CfnSubnet) => void;
}

export class Subnet extends BaseResource {
    public readonly public1a: CfnSubnet;
    public readonly public1c: CfnSubnet;
    public readonly container1a: CfnSubnet;
    public readonly container1c: CfnSubnet;
    public readonly db1a: CfnSubnet;
    public readonly db1c: CfnSubnet;
    public readonly mng1a: CfnSubnet;
    public readonly mng1c: CfnSubnet;
    public readonly egr1a: CfnSubnet;
    public readonly egr1c: CfnSubnet;

    public readonly test: CfnOutput;

    private readonly vpc: Vpc;
    private readonly resources: ResourceInfo[] = [
        {
            id: 'SubnetPublic1a',
            cidrBlock: '10.0.0.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'subnet-public-1a',
            assign: subnet => (this.public1a as CfnSubnet) = subnet
        },
        {
            id: 'SubnetPublic1c',
            cidrBlock: '10.0.1.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'subnet-public-1c',
            assign: subnet => (this.public1c as CfnSubnet) = subnet
        },
        {
            id: 'SubnetContainer1a',
            cidrBlock: '10.0.8.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'subnet-container-1a',
            assign: subnet => (this.container1a as CfnSubnet) = subnet
        },
        {
            id: 'SubnetContainer1c',
            cidrBlock: '10.0.9.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'subnet-container-1c',
            assign: subnet => (this.container1c as CfnSubnet) = subnet
        },
        {
            id: 'SubnetDb1a',
            cidrBlock: '10.0.16.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'subnet-db-1a',
            assign: subnet => (this.db1a as CfnSubnet) = subnet
        },
        {
            id: 'SubnetDb1c',
            cidrBlock: '10.0.17.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'subnet-db-1c',
            assign: subnet => (this.db1c as CfnSubnet) = subnet
        },
        {
            id: 'SubnetMng1a',
            cidrBlock: '10.0.240.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'subnet-mng-1a',
            assign: subnet => (this.mng1a as CfnSubnet) = subnet
        },
        {
            id: 'SubnetMng1c',
            cidrBlock: '10.0.241.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'subnet-mng-1c',
            assign: subnet => (this.mng1c as CfnSubnet) = subnet
        },
        {
            id: 'SubnetEgr1a',
            cidrBlock: '10.0.248.0/24',
            availabilityZone: 'ap-northeast-1a',
            resourceName: 'subnet-egress-1a',
            assign: subnet => (this.egr1a as CfnSubnet) = subnet
        },
        {
            id: 'SubnetEgr1c',
            cidrBlock: '10.0.249.0/24',
            availabilityZone: 'ap-northeast-1c',
            resourceName: 'subnet-egress-1c',
            assign: subnet => (this.egr1c as CfnSubnet) = subnet
        },
    ];

    constructor(scope: Construct, vpc: Vpc) {
        super();

        this.vpc = vpc;
        this.test = new CfnOutput(scope, "test", {
            value: "subnet-00437549cc620da07",
            exportName: 'sbcntr-stg-stack-vpc:ExportsOutputRefSubnetMng1a2D1D4B29'
        });


        for (const resourceInfo of this.resources) {
            const subnet = this.createSubnet(scope, resourceInfo);
            resourceInfo.assign(subnet);
        }

    }

    private createSubnet(scope: Construct, resourceInfo: ResourceInfo): CfnSubnet {
        var resourceName = this.createResourceName(scope, resourceInfo.resourceName)
        const subnet = new CfnSubnet(scope, resourceInfo.id, {
            cidrBlock: resourceInfo.cidrBlock,
            vpcId: this.vpc.vpc.ref,
            availabilityZone: resourceInfo.availabilityZone,
            tags: [{
                key: 'Name',
                value: this.createResourceName(scope, resourceInfo.resourceName)
            }]
        });

        new CfnOutput(scope, resourceName, {
            value: subnet.attrSubnetId,
            description: this.createResourceName(scope, resourceInfo.resourceName),
            exportName: resourceName
        });

        return subnet;
    }


}

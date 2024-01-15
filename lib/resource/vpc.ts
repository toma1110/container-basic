import { CfnVPC } from 'aws-cdk-lib/aws-ec2';
import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseResource } from "./abstract/base-resouce";

export class Vpc extends BaseResource {
    public readonly vpc: CfnVPC;

    constructor(scope: Construct) {
        super();
        const vpcName = this.createResourceName(scope, 'vpc')
        this.vpc = new CfnVPC(scope, 'Vpc', {
            cidrBlock: '10.0.0.0/16',
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: [{
                key: 'Name',
                value: vpcName
            }]
        });

        new CfnOutput(scope, vpcName, {
            value: this.vpc.attrVpcId,
            exportName: vpcName
        });
    }
}

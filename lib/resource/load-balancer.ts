import { CfnListener, CfnLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Fn, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import { BaseResource } from "./abstract/base-resouce";
import { SecurityGroup } from "./security-group";
import { Subnet } from "./subnet";
import { TargetGroup } from "./target-group";


export class LoadBalancer extends BaseResource {
    public readonly albInternal: CfnLoadBalancer;
    public readonly albInternalListener: CfnListener;
    public readonly albInternalListenerTest: CfnListener;
    public readonly albFrontend: CfnLoadBalancer;
    public readonly albFrontendListener: CfnListener;

    constructor(
        scope: Construct,
        securityGroup: SecurityGroup,
        subnet: Subnet,
        targetGroup: TargetGroup
    ) {
        super();
        // クロススタック参照を明確に定義しないとELBだけの削除が不可になる。右記の通り騙せば削除できるらしい　参考：https://qiita.com/ufoo68/items/9d98e70fbb8f021b57f4
        const sbcntrstgsubnetcontainer1aId = Fn.importValue('sbcntr-stg-subnet-container-1a');
        const sbcntrstgsubnetcontainer1cId = Fn.importValue('sbcntr-stg-subnet-container-1c');
        const sbcntrstgsubnetpulic1aId = Fn.importValue('sbcntr-stg-subnet-public-1a');
        const sbcntrstgsubnetpulic1cId = Fn.importValue('sbcntr-stg-subnet-public-1c');

        // Load Balancer
        this.albInternal = new CfnLoadBalancer(scope, 'AlbInternal', {
            ipAddressType: 'ipv4',
            name: this.createResourceName(scope, 'alb-internal'),
            scheme: 'internal',
            securityGroups: [securityGroup.inter.attrGroupId],
            subnets: [sbcntrstgsubnetcontainer1aId, sbcntrstgsubnetcontainer1cId],
            type: 'application'
        });

        // Listener
        this.albInternalListener = new CfnListener(scope, 'AlbListener', {
            defaultActions: [{
                type: 'forward',
                forwardConfig: {
                    targetGroups: [{
                        targetGroupArn: targetGroup.tgSbcntrDemoBlue.ref,
                        weight: 1
                    }]
                }
            }],
            loadBalancerArn: this.albInternal.ref,
            port: 80,
            protocol: 'HTTP'
        });

        new CfnOutput(scope, 'sbcntrStgListenerInternalArn', {
            value: this.albInternalListener.attrListenerArn,
            exportName: 'sbcntr-stg-listener-internal-arn',
        });

        this.albInternalListenerTest = new CfnListener(scope, 'AlbListenerTest', {
            defaultActions: [{
                type: 'forward',
                forwardConfig: {
                    targetGroups: [{
                        targetGroupArn: targetGroup.tgSbcntrDemoGreen.ref,
                        weight: 1
                    }]
                }
            }],
            loadBalancerArn: this.albInternal.ref,
            port: 10080,
            protocol: 'HTTP'
        });



        // Load Balancer
        this.albFrontend = new CfnLoadBalancer(scope, 'AlbFrontend', {
            ipAddressType: 'ipv4',
            name: this.createResourceName(scope, 'alb-frontend'),
            scheme: 'internet-facing',
            securityGroups: [securityGroup.ing.attrGroupId],
            subnets: [sbcntrstgsubnetpulic1aId, sbcntrstgsubnetpulic1cId],
            type: 'application'
        });

        // Listener
        this.albFrontendListener = new CfnListener(scope, 'AlbFrontendListener', {
            defaultActions: [{
                type: 'forward',
                forwardConfig: {
                    targetGroups: [{
                        targetGroupArn: targetGroup.tgFrontend.ref,
                        weight: 1
                    }]
                }
            }],
            loadBalancerArn: this.albFrontend.ref,
            port: 80,
            protocol: 'HTTP'
        });

        new CfnOutput(scope, 'sbcntrStgListenerFrontendArn', {
            value: this.albFrontendListener.attrListenerArn,
            exportName: 'sbcntr-stg-listener-Frontend-arn',
        });
    }
}

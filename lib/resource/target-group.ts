import { Fn, CfnOutput } from "aws-cdk-lib";
import { CfnTargetGroup } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import { BaseResource } from "./abstract/base-resouce";
// import { Instance } from "./instance";

export class TargetGroup extends BaseResource {
    public readonly tgSbcntrDemoBlue: CfnTargetGroup;
    public readonly tgSbcntrDemoGreen: CfnTargetGroup;
    public readonly tgFrontend: CfnTargetGroup;

    constructor(scope: Construct) {
        super();
        const sbcntrStgVpcId = Fn.importValue('sbcntr-stg-vpc');

        this.tgSbcntrDemoBlue = new CfnTargetGroup(scope, 'AlbTargetGroupSbcntrDemoBlue', {
            name: this.createResourceName(scope, 'tg-sbcntrdemo-blue'),
            targetType: 'ip',
            protocol: 'HTTP',
            port: 80,
            protocolVersion: 'HTTP1',
            healthCheckEnabled: true,
            healthCheckIntervalSeconds: 15,
            healthCheckPath: '/healthcheck',
            healthCheckPort: 'traffic-port',
            healthCheckProtocol: 'HTTP',
            healthCheckTimeoutSeconds: 5,
            healthyThresholdCount: 3,
            unhealthyThresholdCount: 2,
            vpcId: sbcntrStgVpcId
        });

        new CfnOutput(scope, 'tgSbcntrDemoBlueArn', {
            value: this.tgSbcntrDemoBlue.attrTargetGroupArn,
            exportName: 'sbcntr-stg-tg-demo-blue-arn',
        });

        this.tgSbcntrDemoGreen = new CfnTargetGroup(scope, 'AlbTargetGroupSbcntrDemoGreen', {
            name: this.createResourceName(scope, 'tg-sbcntrdemo-green'),
            targetType: 'ip',
            protocol: 'HTTP',
            port: 80,
            protocolVersion: 'HTTP1',
            healthCheckEnabled: true,
            healthCheckIntervalSeconds: 15,
            healthCheckPath: '/healthcheck',
            healthCheckPort: 'traffic-port',
            healthCheckProtocol: 'HTTP',
            healthCheckTimeoutSeconds: 5,
            healthyThresholdCount: 3,
            unhealthyThresholdCount: 2,
            vpcId: sbcntrStgVpcId
        });

        new CfnOutput(scope, 'tgSbcntrDemoGreenArn', {
            value: this.tgSbcntrDemoGreen.attrTargetGroupArn,
            exportName: 'sbcntr-stg-tg-demo-green-arn',
        });


        this.tgFrontend = new CfnTargetGroup(scope, 'AlbTargetGroupFrontend', {
            name: this.createResourceName(scope, 'tg-frontend'),
            targetType: 'ip',
            protocol: 'HTTP',
            port: 80,
            protocolVersion: 'HTTP1',
            healthCheckEnabled: true,
            healthCheckIntervalSeconds: 15,
            healthCheckPath: '/healthcheck',
            healthCheckPort: 'traffic-port',
            healthCheckProtocol: 'HTTP',
            healthCheckTimeoutSeconds: 5,
            healthyThresholdCount: 3,
            unhealthyThresholdCount: 2,
            vpcId: sbcntrStgVpcId
        });

        new CfnOutput(scope, 'tgFrontendArn', {
            value: this.tgFrontend.attrTargetGroupArn,
            exportName: 'sbcntr-stg-tg-frontend-arn',
        });

    }
}

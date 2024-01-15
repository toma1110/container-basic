import { Construct } from 'constructs';
import { Fn } from "aws-cdk-lib";
import { CfnVPCEndpoint } from 'aws-cdk-lib/aws-ec2';
import { BaseResource } from './abstract/base-resouce';
import { SecurityGroup } from "./security-group";
import { Vpc } from './vpc';

interface ResourceGatewayInfo {
    readonly id: string;
    readonly resourceName: string;
    readonly serviceName: string;
    readonly vpcId: string
    readonly policyDocument?: any;
    readonly privateDnsEnabled?: boolean;
    readonly routeTableIds: string[];
    readonly assign: (vpcEndpoint: CfnVPCEndpoint) => void;
}

interface ResourceInterfaceInfo {
    readonly id: string;
    readonly resourceName: string;
    readonly serviceName: string;
    readonly vpcId: string
    readonly policyDocument?: any;
    readonly privateDnsEnabled?: boolean;
    readonly securityGroupIds: () => string[];
    readonly subnetIds: string[];
    readonly assign: (vpcEndpoint: CfnVPCEndpoint) => void;
}

export class VpcEndpoint extends BaseResource {
    public readonly s3: CfnVPCEndpoint;
    public readonly ecrdkr: CfnVPCEndpoint;
    public readonly ecrapi: CfnVPCEndpoint;
    public readonly logs: CfnVPCEndpoint;
    public readonly secretsmanager: CfnVPCEndpoint;

    private readonly vpc: Vpc;
    private readonly securityGroup: SecurityGroup;

    private readonly sbcntrStgVpc = Fn.importValue('sbcntr-stg-vpc');
    private readonly sbcntrStgRtbContainer1a = Fn.importValue('sbcntr-stg-rtb-container1a');
    private readonly sbcntrStgRtbContainer1c = Fn.importValue('sbcntr-stg-rtb-container1c');
    private readonly sbcntrstgsubnetcontainer1aId = Fn.importValue('sbcntr-stg-subnet-container-1a');
    private readonly sbcntrstgsubnetcontainer1cId = Fn.importValue('sbcntr-stg-subnet-container-1c');

    private readonly resourcesGateway: ResourceGatewayInfo[] = [
        {
            id: 'vpcEndpointS3',
            resourceName: 'vpcEndpointS3',
            serviceName: 'com.amazonaws.ap-northeast-1.s3',
            vpcId: this.sbcntrStgVpc,
            routeTableIds: [this.sbcntrStgRtbContainer1a, this.sbcntrStgRtbContainer1c],
            assign: GatewayEndpoint => (this.s3 as CfnVPCEndpoint) = GatewayEndpoint
        },
    ];

    private readonly resourcesInterface: ResourceInterfaceInfo[] = [
        {
            id: 'vpcEndpointECRdkr',
            resourceName: 'vpcEndpointECRdkr',
            serviceName: 'com.amazonaws.ap-northeast-1.ecr.dkr',
            vpcId: this.sbcntrStgVpc,
            privateDnsEnabled: true,
            subnetIds: [this.sbcntrstgsubnetcontainer1aId, this.sbcntrstgsubnetcontainer1cId],
            securityGroupIds: () => [this.securityGroup.vpce.attrGroupId],
            assign: InterfaceEndpoint => (this.ecrdkr as CfnVPCEndpoint) = InterfaceEndpoint
        },
        {
            id: 'vpcEndpointECRapi',
            resourceName: 'vpcEndpointECRapi',
            serviceName: 'com.amazonaws.ap-northeast-1.ecr.api',
            vpcId: this.sbcntrStgVpc,
            privateDnsEnabled: true,
            subnetIds: [this.sbcntrstgsubnetcontainer1aId, this.sbcntrstgsubnetcontainer1cId],
            securityGroupIds: () => [this.securityGroup.vpce.attrGroupId],
            assign: InterfaceEndpoint => (this.ecrapi as CfnVPCEndpoint) = InterfaceEndpoint
        },
        {
            id: 'vpcEndpointLogs',
            resourceName: 'vpcEndpointLogs',
            serviceName: 'com.amazonaws.ap-northeast-1.logs',
            vpcId: this.sbcntrStgVpc,
            privateDnsEnabled: true,
            subnetIds: [this.sbcntrstgsubnetcontainer1aId, this.sbcntrstgsubnetcontainer1cId],
            securityGroupIds: () => [this.securityGroup.vpce.attrGroupId],
            assign: InterfaceEndpoint => (this.logs as CfnVPCEndpoint) = InterfaceEndpoint
        },
        {
            id: 'vpcEndpointSecretsManager',
            resourceName: 'vpcEndpointSecretsManager',
            serviceName: 'com.amazonaws.ap-northeast-1.secretsmanager',
            vpcId: this.sbcntrStgVpc,
            privateDnsEnabled: true,
            subnetIds: [this.sbcntrstgsubnetcontainer1aId, this.sbcntrstgsubnetcontainer1cId],
            securityGroupIds: () => [this.securityGroup.vpce.attrGroupId],
            assign: InterfaceEndpoint => (this.secretsmanager as CfnVPCEndpoint) = InterfaceEndpoint
        },
    ];


    constructor(
        scope: Construct,
        securityGroup: SecurityGroup
    ) {
        super();

        this.securityGroup = securityGroup;

        for (const resourceInfo of this.resourcesGateway) {
            const GatewayEndpoint = this.createVpcEndpointGateway(scope, resourceInfo);
            resourceInfo.assign(GatewayEndpoint);
        }

        for (const resourceInfo2 of this.resourcesInterface) {
            const InterfaceEndpoint = this.createVpcEndpointInterface(scope, resourceInfo2);
            resourceInfo2.assign(InterfaceEndpoint);
        }
    }

    private createVpcEndpointGateway(scope: Construct, resourceInfo: ResourceGatewayInfo): CfnVPCEndpoint {
        const cfnVPCEndpoint = new CfnVPCEndpoint(scope, resourceInfo.id, {
            serviceName: resourceInfo.serviceName,
            vpcId: resourceInfo.vpcId,
            policyDocument: resourceInfo.policyDocument,
            privateDnsEnabled: resourceInfo.privateDnsEnabled,
            routeTableIds: resourceInfo.routeTableIds,
            vpcEndpointType: 'Gateway',
        });

        return cfnVPCEndpoint;
    }

    private createVpcEndpointInterface(scope: Construct, resourceInfo: ResourceInterfaceInfo): CfnVPCEndpoint {
        const cfnVPCEndpoint = new CfnVPCEndpoint(scope, resourceInfo.id, {
            serviceName: resourceInfo.serviceName,
            vpcId: resourceInfo.vpcId,
            policyDocument: resourceInfo.policyDocument,
            privateDnsEnabled: resourceInfo.privateDnsEnabled,
            subnetIds: resourceInfo.subnetIds,
            securityGroupIds: resourceInfo.securityGroupIds(),
            // securityGroupIds: ["sg-0af21c81fcbde1425"], //TODO 変数指定するとSG定義されていないというエラーになる　TypeError: Cannot read properties of undefined (reading 'ing') 
            vpcEndpointType: 'Interface',
        });

        return cfnVPCEndpoint;
    }

}

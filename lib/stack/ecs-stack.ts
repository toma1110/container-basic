import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LoadBalancer } from '../resource/load-balancer';
import { SecurityGroup } from '../resource/security-group';
import { Ecs } from '../resource/ecs';
import { TargetGroup } from '../resource/target-group';
import { VpcStack } from './vpc-stack';
import { VpcEndpoint } from '../resource/vpc-endpoint';
import { Vpc } from '../resource/vpc';
import { CodeDeploy } from '../resource/codedeploy';


export class EcsStack extends Stack {
    public readonly loadBalancer: LoadBalancer;
    public readonly securityGroup: SecurityGroup;
    public readonly vpc: Vpc;

    constructor(
        scope: Construct,
        id: string,
        vpcStack: VpcStack,
        props?: StackProps
    ) {
        super(scope, id, props);

        // Security Group
        this.securityGroup = new SecurityGroup(this);

        // Target Group
        const targetGroup = new TargetGroup(this);

        // Load Balancer  ※高額なため作業が日をまたぐ場合は一度コメントアウトし、再開時にコメントインする
        const loadBalancer = new LoadBalancer(this, this.securityGroup, vpcStack.subnet, targetGroup);

        // VPCEndpoint  ※高額なため作業が日をまたぐ場合は一度コメントアウトし、再開時にコメントインする
        new VpcEndpoint(this, this.securityGroup);

        // // ECS 「targetGroupが無いとエラーになる。」　※高額なため作業が日をまたぐ場合は一度コメントアウトし、再開時にコメントインする
        // const ecs = new Ecs(this, vpcStack.vpc, Stack.of(this).account, this.securityGroup, targetGroup, loadBalancer);

        // // CodeDeploy　「targetGroupが無いとエラーになる。」
        // const codedeploy = new CodeDeploy(this, this.securityGroup);


    }
}

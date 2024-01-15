import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RdsDatabase } from '../resource/rds-database';
import { RdsParameterGroup } from '../resource/rds-parameter-group';
import { RdsSubnetGroup } from '../resource/rds-subnet-group';
import { EcsStack } from './ecs-stack';
import { IamStack } from './iam-stack';
import { SecretsManagerStack } from './secrets-manager-stack';
import { VpcStack } from './vpc-stack';

export class RdsStack extends Stack {
    constructor(
        scope: Construct,
        id: string,
        vpcStack: VpcStack,
        iamStack: IamStack,
        ecsStack: EcsStack,
        secretsManagerStack: SecretsManagerStack,
        props?: StackProps
    ) {
        super(scope, id, props);

        // Subnet Group
        const subnetGroup = new RdsSubnetGroup(this, vpcStack.subnet);

        // Parameter Group
        const parameterGroup = new RdsParameterGroup(this);

        // Database
        new RdsDatabase(
            this,
            subnetGroup,
            parameterGroup,
            secretsManagerStack.secret,
            ecsStack.securityGroup,
            iamStack.role
        );
    }
}

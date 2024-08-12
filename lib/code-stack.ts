import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './stack/vpc-stack';
import { EcrStack } from './stack/ecr-stack';
import { EcsStack } from './stack/ecs-stack';
import { IamStack } from './stack/iam-stack';
import { SecretsManagerStack } from './stack/secrets-manager-stack';
import { RdsStack } from './stack/rds-stack';
import { SecretsManagerDBUserStack } from './stack/secrets-manager-stack-dbuser';
import { CICDStack } from './stack/cicd-stack';

export class CodeStack {
  constructor(scope: Construct, id: string, props?: StackProps) {

    // AWSコンテナ構築・運用ハンズオン【ECS、Fargate】 https://note.shiftinc.jp/n/n16cdcc2df8bf
    // VPC Stack
    const vpcStack = new VpcStack(scope, 'VpcStack', {
      ...props,
      stackName: this.createStackName(scope, 'vpc')
    });

    // IAM Stack
    const iamStack = new IamStack(scope, 'IamStack', {
      ...props,
      stackName: this.createStackName(scope, 'iam')
    });

    // ECR Stack
    const ecrStack = new EcrStack(scope, 'EcrStack', {
      ...props,
      stackName: this.createStackName(scope, 'ecr')
    });

    // ECS Stack
    const ecsStack = new EcsStack(scope, 'EcsStack', vpcStack, {
      ...props,
      stackName: this.createStackName(scope, 'ecs')
    });
    ecsStack.addDependency(iamStack);

    // SecretsManager Stack
    const secretsManagerStack = new SecretsManagerStack(scope, 'SecretsManagerMasterUserStack', {
      ...props,
      stackName: this.createStackName(scope, 'secretsmanager')
    });

    // RDS Stack
    const rdsstack = new RdsStack(scope, 'RdsStack', vpcStack, iamStack, ecsStack, secretsManagerStack, {
      stackName: this.createStackName(scope, 'rds')
    });

    // Secrets Manager (DB User)Stack
    const secretsManagerDBUserStack = new SecretsManagerDBUserStack(scope, 'SecretsManagerDBUserStack', {
      stackName: this.createStackName(scope, 'secretsmanagerdbuser')
    });
    secretsManagerDBUserStack.addDependency(rdsstack)


    // AWSコンテナCI/CD実装ハンズオン【ECS、Fargate】 https://note.shiftinc.jp/n/XXXXXXX

    // CI/CDStack
    const cicdStack = new CICDStack(scope, 'CICDStack', {
      stackName: this.createStackName(scope, 'cicd')
    });

  }


  private createStackName(scope: Construct, originalName: string): string {
    const systemName = scope.node.tryGetContext('systemName');
    const envType = scope.node.tryGetContext('envType');
    const stackNamePrefix = `${systemName}-${envType}-stack-`;

    return `${stackNamePrefix}${originalName}`;
  }
}

